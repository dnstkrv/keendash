#!/bin/sh
# Builds an opkg feed (Packages + Packages.gz) from the .ipk files in a directory.
#   scripts/make-feed.sh <dir-with-ipk>
# Use it per architecture directory, then serve the directory as: src/gz keendash <url>
set -eu
DIR=${1:?usage: make-feed.sh <dir-with-ipk>}
: > "$DIR/Packages"
for ipk in "$DIR"/*.ipk; do
  [ -f "$ipk" ] || continue
  tmp=$(mktemp -d)
  tar -xzf "$ipk" -C "$tmp" ./control.tar.gz
  tar -xzf "$tmp/control.tar.gz" -C "$tmp" ./control
  {
    cat "$tmp/control"
    echo "Filename: $(basename "$ipk")"
    echo "Size: $(wc -c < "$ipk")"
    echo "MD5Sum: $(md5sum "$ipk" | cut -d' ' -f1)"
    echo "SHA256sum: $(sha256sum "$ipk" | cut -d' ' -f1)"
    echo
  } >> "$DIR/Packages"
  rm -rf "$tmp"
done
gzip -9 -c "$DIR/Packages" > "$DIR/Packages.gz"
echo "feed written to $DIR"
