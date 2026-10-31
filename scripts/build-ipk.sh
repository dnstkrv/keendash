#!/bin/sh
# Builds dist/keendash_<version>_<arch>.ipk (opkg package for Entware).
#   scripts/build-ipk.sh <arch> [version]
# arch: Entware architecture string, e.g. aarch64-3.10, mipsel-3.4, mips-3.4
# The package contains only shell scripts and JS, so the payload is identical for every arch;
# the Architecture field only decides which Entware feed/opkg accepts it.
set -eu
ARCH=${1:?usage: build-ipk.sh <arch> [version]}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
VERSION=${2:-$(cat "$ROOT/VERSION")}
SOURCE=${SOURCE_URL:-https://github.com/${GITHUB_REPOSITORY:-OWNER/keendash}}
PKG=keendash
OUT="$ROOT/dist"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/data" "$WORK/control" "$OUT"
cp -R "$ROOT/files/opt" "$WORK/data/opt"

# permissions do not depend on how the repo was checked out
find "$WORK/data" -type d -exec chmod 755 {} +
find "$WORK/data" -type f -exec chmod 644 {} +
chmod 755 "$WORK"/data/opt/share/keendash/bin/* "$WORK"/data/opt/share/keendash/www/cgi-bin/* \
          "$WORK"/data/opt/etc/init.d/* "$WORK"/data/opt/etc/cron.1min/* "$WORK"/data/opt/etc/cron.5mins/*

SIZE=$(du -sk "$WORK/data" | cut -f1)
sed -e "s|@VERSION@|$VERSION|" -e "s|@ARCH@|$ARCH|" -e "s|@SOURCE@|$SOURCE|" -e "s|@SIZE@|$SIZE|" \
    "$ROOT/ipk/control" > "$WORK/control/control"
cp "$ROOT/ipk/conffiles" "$WORK/control/conffiles"
for s in postinst prerm postrm; do cp "$ROOT/ipk/$s" "$WORK/control/$s"; chmod 755 "$WORK/control/$s"; done

TAR_OPTS="--owner=0 --group=0 --numeric-owner"
# shellcheck disable=SC2086
tar $TAR_OPTS -czf "$WORK/control.tar.gz" -C "$WORK/control" .
# shellcheck disable=SC2086
tar $TAR_OPTS -czf "$WORK/data.tar.gz" -C "$WORK/data" .
echo 2.0 > "$WORK/debian-binary"

IPK="$OUT/${PKG}_${VERSION}_${ARCH}.ipk"
# same layout as opkg-build: a gzip-compressed tar of debian-binary, data and control
# shellcheck disable=SC2086
tar $TAR_OPTS -czf "$IPK" -C "$WORK" ./debian-binary ./data.tar.gz ./control.tar.gz
echo "built $IPK ($(wc -c < "$IPK") bytes)"
