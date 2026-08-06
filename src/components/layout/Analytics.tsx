import Script from 'next/script'

/**
 * Аналитика подключается только при заданном идентификаторе и всегда
 * стратегией `afterInteractive`: скрипт не блокирует рендер.
 */
export const Analytics = ({ metrikaId }: { metrikaId: string }) => {
  if (!metrikaId || !/^\d+$/.test(metrikaId)) return null

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
        ym(${metrikaId}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true });
      `}
    </Script>
  )
}
