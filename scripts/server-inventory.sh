#!/usr/bin/env bash
#
# Инвентаризация сервера перед развёртыванием сайта «Серая Мышь».
#
# ЧТО ДЕЛАЕТ:  только читает и складывает отчёт в файл.
# ЧЕГО НЕ ДЕЛАЕТ: ничего не устанавливает, не запускает, не останавливает,
#                 не меняет конфигурацию и не трогает соседние проекты.
#
# БЕЗОПАСНОСТЬ: содержимое .env, приватные ключи, пароли и токены не читаются.
#               В строках конфигурации логин:пароль внутри URL маскируются.
#               Всё равно просмотрите отчёт перед отправкой.
#
# ЗАПУСК:
#     bash server-inventory.sh              # без прав root — часть данных будет недоступна
#     sudo bash server-inventory.sh         # полнее: имена процессов на портах, конфиги nginx
#
# Результат: /tmp/greymouse-server-report-<хост>-<дата>.txt

set -u

REPORT="/tmp/greymouse-server-report-$(hostname -s 2>/dev/null || echo host)-$(date +%Y%m%d-%H%M).txt"
: > "$REPORT"

# ── вспомогательные функции ──────────────────────────────────────────────────

out() { printf '%s\n' "$*" >> "$REPORT"; }
section() { out ""; out "════════════════════════════════════════════════════════════"; out "  $*"; out "════════════════════════════════════════════════════════════"; }
sub() { out ""; out "── $* ──"; }
have() { command -v "$1" >/dev/null 2>&1; }

# Выполнить команду и записать вывод (или пометку об отсутствии/ошибке).
run() {
  local label="$1"; shift
  if have "$1"; then
    local o
    o="$("$@" 2>&1)" || true
    if [ -n "$o" ]; then out "$label:"; printf '%s\n' "$o" | sed 's/^/    /' >> "$REPORT"
    else out "$label: (пусто)"; fi
  else
    out "$label: команда «$1» не найдена"
  fi
}

# Маскировка учётных данных в URL вида scheme://user:pass@host
mask() { sed -E 's#(://)[^:/@[:space:]]+:[^@[:space:]]+@#\1***:***@#g'; }

IS_ROOT=0
[ "$(id -u)" -eq 0 ] && IS_ROOT=1

out "Отчёт об окружении сервера — подготовка к развёртыванию «Серая Мышь»"
out "Собран: $(date -Is)"
out "Права: $([ $IS_ROOT -eq 1 ] && echo 'root' || echo "обычный пользователь ($(id -un))")"
[ $IS_ROOT -eq 0 ] && out "ВНИМАНИЕ: без sudo не видны имена процессов на портах и конфиги nginx."

# ── 1. Система ───────────────────────────────────────────────────────────────
section "1. СИСТЕМА И РЕСУРСЫ"

out "Хост: $(hostname -f 2>/dev/null || hostname)"
out "Ядро: $(uname -srm)"
if [ -r /etc/os-release ]; then
  out "ОС:   $(. /etc/os-release && echo "$PRETTY_NAME")"
fi
out "Аптайм: $(uptime -p 2>/dev/null || uptime)"
out "Архитектура: $(uname -m)"

sub "Процессор и память"
out "Ядер CPU: $(nproc 2>/dev/null || echo '?')"
if have free; then out "Память:"; free -h 2>/dev/null | sed 's/^/    /' >> "$REPORT"; fi
out "Swap: $(swapon --show=NAME,SIZE --noheadings 2>/dev/null | tr '\n' ' ' || echo 'нет данных')"

sub "Диски"
df -hT -x tmpfs -x devtmpfs 2>/dev/null | sed 's/^/    /' >> "$REPORT"

sub "Виртуализация"
out "$(systemd-detect-virt 2>/dev/null || echo 'не определена')"

# ── 2. Среды выполнения ──────────────────────────────────────────────────────
section "2. УСТАНОВЛЕННЫЕ СРЕДЫ ВЫПОЛНЕНИЯ"
out "Нужно: Node.js 20.9+ (или Docker) и PostgreSQL 14+."
out ""

for bin in node npm pnpm yarn corepack docker git curl openssl psql nginx caddy certbot python3; do
  if have "$bin"; then
    ver="$("$bin" --version 2>&1 | head -1)"
    out "  ✓ $(printf '%-10s' "$bin") $(printf '%s' "$ver" | mask)"
  else
    out "  ✗ $(printf '%-10s' "$bin") не установлен"
  fi
done

sub "Менеджеры версий Node"
for vm in "$HOME/.nvm" "$HOME/.fnm" "$HOME/.volta" /usr/local/n; do
  [ -d "$vm" ] && out "  найден: $vm"
done
have asdf && out "  найден: asdf"

sub "Docker Compose"
if have docker; then
  out "  plugin: $(docker compose version 2>&1 | head -1)"
  have docker-compose && out "  legacy: $(docker-compose --version 2>&1 | head -1)"
fi

# ── 3. Docker ────────────────────────────────────────────────────────────────
section "3. DOCKER: ЧТО УЖЕ КРУТИТСЯ"

if have docker && docker info >/dev/null 2>&1; then
  sub "Контейнеры (все)"
  docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>&1 \
    | sed 's/^/    /' >> "$REPORT"

  sub "Сети"
  docker network ls --format 'table {{.Name}}\t{{.Driver}}\t{{.Scope}}' 2>&1 | sed 's/^/    /' >> "$REPORT"

  sub "Тома"
  docker volume ls --format 'table {{.Name}}\t{{.Driver}}' 2>&1 | sed 's/^/    /' >> "$REPORT"

  sub "Занятое место"
  docker system df 2>&1 | sed 's/^/    /' >> "$REPORT"

  sub "Контейнеры с PostgreSQL"
  docker ps -a --filter ancestor=postgres --format '{{.Names}} | {{.Image}} | {{.Status}} | {{.Ports}}' 2>&1 \
    | sed 's/^/    /' >> "$REPORT"
  docker ps -a --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -i -E 'postgres|pgsql' \
    | sed 's/^/    /' >> "$REPORT"

  sub "Политика перезапуска у работающих контейнеров"
  for c in $(docker ps --format '{{.Names}}' 2>/dev/null); do
    out "    $c: $(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$c" 2>/dev/null)"
  done
else
  out "Docker недоступен (не установлен, не запущен или нет прав у текущего пользователя)."
  have docker && out "Подсказка: попробуйте запустить скрипт через sudo."
fi

# ── 4. Порты ─────────────────────────────────────────────────────────────────
section "4. ЗАНЯТЫЕ ПОРТЫ"

sub "Слушающие сокеты"
if have ss; then
  ss -tlnp 2>/dev/null | sed 's/^/    /' >> "$REPORT"
elif have netstat; then
  netstat -tlnp 2>/dev/null | sed 's/^/    /' >> "$REPORT"
else
  out "    ни ss, ни netstat не найдены"
fi

sub "Проверка портов-кандидатов для приложения"
out "Приложению нужен один свободный порт (по умолчанию 3000)."
for p in 3000 3001 3002 3003 3010 4000 8080; do
  busy=""
  if have ss; then
    ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$p\$" && busy="занят"
  fi
  out "    порт $p: ${busy:-свободен}"
done

# ── 5. Обратный прокси ───────────────────────────────────────────────────────
section "5. ОБРАТНЫЙ ПРОКСИ И ВИРТУАЛЬНЫЕ ХОСТЫ"

if have nginx; then
  out "nginx: $(nginx -v 2>&1)"
  out "Проверка конфигурации:"
  nginx -t 2>&1 | sed 's/^/    /' >> "$REPORT"

  sub "Подключённые конфиги"
  for d in /etc/nginx/sites-enabled /etc/nginx/conf.d /etc/nginx/sites-available; do
    [ -d "$d" ] && { out "  $d:"; ls -1 "$d" 2>/dev/null | sed 's/^/    /' >> "$REPORT"; }
  done

  sub "Маршрутизация (только строки server_name / listen / proxy_pass / root)"
  out "Пароли в URL замаскированы. Остальные директивы не выводятся."
  if [ $IS_ROOT -eq 1 ] || [ -r /etc/nginx/nginx.conf ]; then
    grep -rhE '^\s*(server_name|listen|proxy_pass|root|ssl_certificate)\s' \
      /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null \
      | sed -E 's/^\s+//' | mask | sort -u | sed 's/^/    /' >> "$REPORT"
  else
    out "    нет прав на чтение — перезапустите через sudo"
  fi
elif have caddy; then
  out "caddy: $(caddy version 2>&1)"
  sub "Caddyfile (строки с доменами и reverse_proxy)"
  grep -hE 'reverse_proxy|^\S+\.' /etc/caddy/Caddyfile 2>/dev/null | mask | sed 's/^/    /' >> "$REPORT"
elif have apache2 || have httpd; then
  out "Обнаружен Apache — приложению нужен reverse proxy на его порт."
  ls -1 /etc/apache2/sites-enabled 2>/dev/null | sed 's/^/    /' >> "$REPORT"
else
  out "Обратный прокси не обнаружен."
  out "Проверьте, не работает ли Traefik/другой прокси в Docker (раздел 3)."
fi

sub "Traefik в контейнерах"
have docker && docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -i traefik | sed 's/^/    /' >> "$REPORT"

# ── 6. PostgreSQL ────────────────────────────────────────────────────────────
section "6. POSTGRESQL"
out "Пароли и содержимое pg_hba не выводятся — только версии, имена БД и способы аутентификации."

if have pg_lsclusters; then
  sub "Кластеры (Debian/Ubuntu)"
  pg_lsclusters 2>&1 | sed 's/^/    /' >> "$REPORT"
fi

if have psql; then
  sub "Подключение к локальному серверу"
  if [ $IS_ROOT -eq 1 ] && id postgres >/dev/null 2>&1; then
    out "  Версия:"
    su postgres -c 'psql -tAc "select version()"' 2>&1 | sed 's/^/    /' >> "$REPORT"

    out "  Базы данных (имя | владелец | размер):"
    su postgres -c "psql -tA -F' | ' -c \"select datname, pg_get_userbyid(datdba), pg_size_pretty(pg_database_size(datname)) from pg_database where not datistemplate order by 1\"" 2>&1 \
      | sed 's/^/    /' >> "$REPORT"

    out "  Роли (пароли не выводятся):"
    su postgres -c "psql -tA -F' | ' -c \"select rolname, rolsuper, rolcreatedb from pg_roles where rolname not like 'pg_%' order by 1\"" 2>&1 \
      | sed 's/^/    /' >> "$REPORT"

    out "  Способы аутентификации из pg_hba (без адресов):"
    su postgres -c 'psql -tA -c "select distinct type, method from pg_hba_file_rules"' 2>&1 \
      | sed 's/^/    /' >> "$REPORT"
  else
    out "    нет доступа под пользователем postgres — перезапустите через sudo"
  fi
else
  out "psql не установлен. PostgreSQL может работать в Docker — см. раздел 3."
fi

# ── 7. Сертификаты ───────────────────────────────────────────────────────────
section "7. TLS-СЕРТИФИКАТЫ"
out "Домен студии: сераямышь.рф → xn--80apaghdkxi3f.xn--p1ai"
out "Сертификат нужно выпускать на punycode-имя."

if have certbot; then
  sub "certbot certificates"
  if [ $IS_ROOT -eq 1 ]; then
    certbot certificates 2>&1 | grep -vE 'Private Key' | sed 's/^/    /' >> "$REPORT"
  else
    out "    нужен sudo"
  fi
fi

sub "Каталоги Let's Encrypt"
if [ -d /etc/letsencrypt/live ]; then
  ls -1 /etc/letsencrypt/live 2>/dev/null | sed 's/^/    /' >> "$REPORT"
else
  out "    /etc/letsencrypt/live отсутствует"
fi

sub "Автопродление"
systemctl list-timers 2>/dev/null | grep -iE 'certbot|acme|renew' | sed 's/^/    /' >> "$REPORT"
have docker && docker ps --format '{{.Names}} {{.Image}}' 2>/dev/null | grep -iE 'acme|certbot' | sed 's/^/    /' >> "$REPORT"

# ── 8. Службы и автозапуск ───────────────────────────────────────────────────
section "8. СЛУЖБЫ И ЗАДАНИЯ"

sub "Активные systemd-службы (кроме системных)"
if have systemctl; then
  systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null \
    | grep -vE 'systemd-|dbus|cron|ssh|rsyslog|polkit|udev|getty|networkd|resolved|snapd|unattended' \
    | awk '{print $1, $4}' | sed 's/^/    /' >> "$REPORT"
fi

sub "Таймеры"
systemctl list-timers --no-pager --no-legend 2>/dev/null | head -20 | sed 's/^/    /' >> "$REPORT"

sub "Задания cron текущего пользователя"
crontab -l 2>/dev/null | grep -v '^#' | mask | sed 's/^/    /' >> "$REPORT" || out "    нет"

# ── 9. Проекты на диске ──────────────────────────────────────────────────────
section "9. ГДЕ ЛЕЖАТ ПРОЕКТЫ"
out "Выводятся только пути и признаки. Содержимое файлов не читается."

for base in /var/www /srv /opt /home /root; do
  [ -d "$base" ] || continue
  sub "$base"
  find "$base" -maxdepth 3 \( -name package.json -o -name docker-compose.yml -o -name docker-compose.yaml -o -name Dockerfile \) \
    -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null \
    | head -30 | sed 's/^/    /' >> "$REPORT"
done

sub "Файлы .env (только факт наличия, содержимое НЕ читается)"
find /var/www /srv /opt /home -maxdepth 4 -name '.env' -not -path '*/node_modules/*' 2>/dev/null \
  | head -20 | while read -r f; do
      out "    $f  (владелец: $(stat -c '%U' "$f" 2>/dev/null), права: $(stat -c '%a' "$f" 2>/dev/null))"
    done

sub "Свободное место в предполагаемых каталогах развёртывания"
for d in /var/www /srv /opt; do
  [ -d "$d" ] && out "    $d: $(df -h "$d" 2>/dev/null | awk 'NR==2{print $4" свободно из "$2}')"
done

# ── 10. Сеть и firewall ──────────────────────────────────────────────────────
section "10. СЕТЬ, DNS, FIREWALL"

sub "Внешний IP-адрес сервера"
ext_ip="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || curl -fsS --max-time 5 https://ifconfig.me 2>/dev/null || echo 'не удалось определить')"
out "    $ext_ip"

sub "Куда сейчас указывает домен"
for host in xn--80apaghdkxi3f.xn--p1ai www.xn--80apaghdkxi3f.xn--p1ai; do
  if have dig; then
    out "    $host → $(dig +short "$host" 2>/dev/null | tr '\n' ' ' || echo 'нет записи')"
  elif have host; then
    out "    $host → $(host "$host" 2>/dev/null | head -2 | tr '\n' ' ')"
  else
    out "    dig/host не установлены"
    break
  fi
done
out "    (совпадение с внешним IP выше означает, что DNS уже настроен)"

sub "Firewall"
if have ufw; then
  ufw status verbose 2>&1 | sed 's/^/    /' >> "$REPORT"
elif have firewall-cmd; then
  firewall-cmd --list-all 2>&1 | sed 's/^/    /' >> "$REPORT"
else
  out "    ufw/firewalld не найдены"
  have iptables && out "    правил iptables: $(iptables -S 2>/dev/null | wc -l)"
fi

sub "SELinux"
have getenforce && out "    $(getenforce 2>/dev/null)" || out "    не используется"

# ── 11. Итоговая сводка ──────────────────────────────────────────────────────
section "11. КРАТКАЯ СВОДКА ДЛЯ РАЗВЁРТЫВАНИЯ"

node_ok="нет"
if have node; then
  nv="$(node -v 2>/dev/null | tr -d 'v')"
  major="${nv%%.*}"
  [ "${major:-0}" -ge 20 ] 2>/dev/null && node_ok="да (v$nv)" || node_ok="устарел (v$nv, нужен 20.9+)"
fi

out "Node.js 20.9+ ............ $node_ok"
out "Docker .................. $(have docker && docker info >/dev/null 2>&1 && echo 'да' || echo 'нет или нет прав')"
out "PostgreSQL 14+ .......... $(have psql && psql --version 2>/dev/null | awk '{print $3}' || echo 'локально не найден')"
out "Обратный прокси ......... $(have nginx && echo nginx || (have caddy && echo caddy || echo 'не найден'))"
out "Let's Encrypt ........... $([ -d /etc/letsencrypt/live ] && echo 'настроен' || echo 'не настроен')"
out "Внешний IP .............. $ext_ip"
out ""
out "Что понадобится решить:"
out "  1) свободный порт для приложения (см. раздел 4);"
out "  2) отдельная база и роль PostgreSQL, либо контейнер (раздел 6);"
out "  3) хранилище для загруженных файлов: S3-совместимое или том Docker;"
out "  4) vhost обратного прокси на punycode-домен (разделы 5 и 7)."

out ""
out "──────────────────────────────────────────────────────────────"
out "Конец отчёта."

# ── вывод ────────────────────────────────────────────────────────────────────
echo
echo "Готово. Отчёт: $REPORT"
echo
echo "Строк в отчёте: $(wc -l < "$REPORT")"
echo
echo "Просмотрите его перед отправкой:"
echo "    less $REPORT"
echo
echo "Скрипт ничего не менял на сервере."
