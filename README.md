# keendash

Карточка «Сервисы» на главной странице веб-интерфейса Keenetic (NDMS) для сервисов, установленных через Entware.

- статус всех init.d-сервисов Entware (`S99firc` → `firc`), ссылки на их веб-страницы (порты и заголовки определяются автоматически);
- вкладки с графиками: **telemt**, **AWG-Manager**, **firc**, **nfqws**, **Antiscan**, **Система**;
- вкладка показывается только если сервис установлен;
- карточку можно перетаскивать, как родные карточки Keenetic.

Работает на любых Keenetic с Entware.

## Установка

Узнайте архитектуру Entware (`opkg print-architecture`: `aarch64-3.10`, `mipsel-3.4` или `mips-3.4`), добавьте фид и установите пакет:

```sh
echo "src/gz keendash https://dnstkrv.github.io/keendash/aarch64-3.10" >> /opt/etc/opkg.conf
opkg update && opkg install keendash
```

Зависимости (`lighttpd`, `lighttpd-mod-cgi`, `cron`) установятся автоматически. После установки обновите страницу роутера (Ctrl+F5). Обновление: `opkg update && opkg upgrade keendash`.

## Настройка

Все настройки в одном файле `/opt/etc/keendash/keendash.conf`:

```sh
PORT=8189          # порт веб-сервера виджета
LAN_IFACE="br0"    # интерфейс, на чьём адресе слушает сервер
LAN_IP=""          # или явный адрес
GEO=1              # страны у адресов Antiscan (0 = выключить)
LINKS="            # ручные ссылки на веб-страницы сервисов
firc=666
telemt=hide
"
```

Значения `LINKS`: `имя=порт`, `имя=http://хост/путь`, `имя=-` (без ссылки), `имя=hide` (скрыть сервис). После правки: `/opt/etc/init.d/S81keendash restart`. Сервисы и порты автообнаруживаются раз в 5 минут, принудительно: `/opt/share/keendash/bin/services --discover`.

### Страны в Antiscan

Коды стран определяются через ip-api.com по **HTTP**, то есть заблокированные адреса уходят с роутера в сторонний сервис. Отключить: `GEO=0` в `keendash.conf`.

## Как это работает

`keendash` делает две вещи:

1. Запускает отдельную копию lighttpd (`keendash-httpd`) на LAN-адресе: CGI `status.cgi` отдаёт JSON, `widgets/services.js` — карточку.
2. Через `bin/patch` собирает копию `index.html` веб-интерфейса со вставленным загрузчиком и bind-mount'ит её поверх оригинала. Копия пересобирается при каждом старте, поэтому обновления прошивки не ломают патч. Откат: остановка сервиса (`S81keendash stop`) или удаление пакета.

Cron (`/opt/etc/cron.1min/keendash`) раз в минуту собирает метрики в `/tmp/keendash` (в RAM) для графиков.

## Ограничения

- Только HTTP в локальной сети: при открытии роутера по HTTPS браузер заблокирует запросы (mixed content).

## Удаление

`opkg remove keendash`

## Лицензия

MIT
