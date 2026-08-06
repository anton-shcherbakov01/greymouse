#!/usr/bin/env bash
#
# Устанавливает виртуальный хост сераямышь.рф, сам выбирая нужный конфиг:
#
#   сертификата ещё нет → seraya-mysh-bootstrap.conf (только :80 и ACME)
#   сертификат выпущен  → seraya-mysh.conf           (:443, проксирование)
#
# Запускать можно сколько угодно раз: до выпуска сертификата ставится временный
# конфиг, после — конечный. Нужен root.
#
#   sudo deploy/nginx/install-vhost.sh
#
# Если `nginx -t` не проходит, скрипт возвращает предыдущее состояние. Это не
# перестраховка: неработающий файл в sites-enabled обрушит nginx при следующем
# перезапуске, а вместе с ним и все остальные сайты сервера.

set -euo pipefail

DOMAIN=xn--80apaghdkxi3f.xn--p1ai
CERT=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
WEBROOT=/var/www/certbot

AVAILABLE=/etc/nginx/sites-available/seraya-mysh
ENABLED=/etc/nginx/sites-enabled/seraya-mysh

HERE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

if [[ $EUID -ne 0 ]]; then
    echo "Нужны права root: sudo $0" >&2
    exit 1
fi

if [[ -f $CERT ]]; then
    SOURCE=$HERE/seraya-mysh.conf
    MODE="конечный: HTTPS, проксирование на 127.0.0.1:3002"
else
    SOURCE=$HERE/seraya-mysh-bootstrap.conf
    MODE="временный: только :80 и проверка домена — сертификата ещё нет"
    echo "Сертификат $CERT не найден."
fi

echo "Ставится конфиг ($MODE)"

mkdir -p "$WEBROOT"

# Резервная копия: на неё откатываемся, если проверка не пройдёт.
BACKUP=
if [[ -f $AVAILABLE ]]; then
    BACKUP=$(mktemp)
    cp -- "$AVAILABLE" "$BACKUP"
fi
WAS_ENABLED=no
[[ -e $ENABLED ]] && WAS_ENABLED=yes

restore() {
    if [[ -n $BACKUP ]]; then
        cp -- "$BACKUP" "$AVAILABLE"
    else
        rm -f -- "$AVAILABLE"
    fi
    [[ $WAS_ENABLED == no ]] && rm -f -- "$ENABLED"
    rm -f -- "${BACKUP:-/dev/null}"
}

cp -- "$SOURCE" "$AVAILABLE"
ln -sfn -- "$AVAILABLE" "$ENABLED"

if ! nginx -t; then
    restore
    echo >&2
    echo "nginx -t не прошёл — вернул предыдущее состояние, чужие сайты не затронуты." >&2
    exit 1
fi

systemctl reload nginx
rm -f -- "${BACKUP:-/dev/null}"

echo
echo "Готово. Конфиг применён ($MODE)"
if [[ ! -f $CERT ]]; then
    cat <<EOF

Следующий шаг — выпустить сертификат, предварительно убедившись, что домен
резолвится (без этого Let's Encrypt ответит NXDOMAIN):

    dig +short $DOMAIN @8.8.8.8
    dig +short www.$DOMAIN @8.8.8.8

    sudo certbot certonly --webroot -w $WEBROOT -d $DOMAIN -d www.$DOMAIN

После выпуска запустите этот же скрипт ещё раз — он поставит конечный конфиг.
EOF
fi
