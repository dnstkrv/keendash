#!/bin/sh
# Mbed TLS source for keendashd's HTTPS: the release tarball, downloaded once into .cache/ and checked
# against the SHA256 published with the release. Prints the source directory.
#   scripts/mbedtls.sh
set -eu
V=3.6.7
SHA=a7e8bcbec0e6f761b4af24f25677626b35f762f68eef79c08677a363212d11f6
ROOT=$(cd "$(dirname "$0")/.." && pwd)
D="$ROOT/.cache/mbedtls-$V"
if [ ! -f "$D/library/ssl_tls.c" ]; then
  mkdir -p "$ROOT/.cache"
  T="$ROOT/.cache/mbedtls-$V.tar.bz2"
  curl -fsSL -o "$T" "https://github.com/Mbed-TLS/mbedtls/releases/download/mbedtls-$V/mbedtls-$V.tar.bz2"
  echo "$SHA  $T" | sha256sum -c - >&2
  tar -xjf "$T" -C "$ROOT/.cache"
  rm -f "$T"
fi
echo "$D"
