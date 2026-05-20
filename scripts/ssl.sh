#!/bin/sh

# =========================================================
# Script de validation et génération de fullchain
# Usage: ./check_cert_chain.sh leaf.crt intermediate.crt private.key
# =========================================================

set -e

LEAF="$1"
INTERMEDIATE="$2"
KEY="$3"
FULLCHAIN="fullchain.crt"

log() {
    echo "[INFO] $1"
}

error() {
    echo "[ERROR] $1"
    exit 1
}

separator() {
    echo "--------------------------------------------------"
}

# =========================================================
# Vérification des paramètres
# =========================================================

if [ $# -ne 3 ]; then
    error "Usage: $0 leaf.crt intermediate.crt private.key"
fi

[ -f "$LEAF" ] || error "Leaf certificate not found: $LEAF"
[ -f "$INTERMEDIATE" ] || error "Intermediate certificate not found: $INTERMEDIATE"
[ -f "$KEY" ] || error "Private key not found: $KEY"

separator
log "Starting certificate validation"
separator

# =========================================================
# Affichage des informations
# =========================================================

log "Leaf certificate subject:"
openssl x509 -noout -subject -in "$LEAF"

log "Leaf certificate issuer:"
openssl x509 -noout -issuer -in "$LEAF"

separator

log "Intermediate certificate subject:"
openssl x509 -noout -subject -in "$INTERMEDIATE"

log "Intermediate certificate issuer:"
openssl x509 -noout -issuer -in "$INTERMEDIATE"

separator

# =========================================================
# Vérification correspondance leaf ↔ intermediate
# =========================================================

log "Checking leaf is signed by intermediate..."

log "Checking leaf is signed by intermediate (cryptographic check)..."

VERIFY_RESULT=`openssl verify -untrusted "$INTERMEDIATE" "$LEAF" 2>&1`

echo "$VERIFY_RESULT"

echo "$VERIFY_RESULT" | grep ": OK" > /dev/null

if [ $? -eq 0 ]; then
    log "OK: Leaf is correctly signed by Intermediate"
else
    error "Leaf is NOT signed by Intermediate"
fi

separator

# =========================================================
# Vérification correspondance key ↔ leaf
# =========================================================

log "Checking private key matches leaf certificate..."

LEAF_MOD=$(openssl x509 -noout -modulus -in "$LEAF" | openssl md5)
KEY_MOD=$(openssl rsa -noout -modulus -in "$KEY" | openssl md5)

echo "LEAF_MOD:$LEAF_MOD KEY_MOD:$KEY_MOD"

if [ "$LEAF_MOD" = "$KEY_MOD" ]; then
    log "OK: Private key matches Leaf certificate"
else
    error "Private key does NOT match Leaf certificate"
fi

separator

# =========================================================
# Génération fullchain
# =========================================================

log "Generating fullchain.crt..."

cat "$LEAF" "$INTERMEDIATE" > "$FULLCHAIN"

log "Fullchain generated: $FULLCHAIN"

separator

# =========================================================
# Vérification chaîne complète
# =========================================================

log "Verifying fullchain structure..."

CERT_COUNT=$(grep -c "BEGIN CERTIFICATE" "$FULLCHAIN")

if [ "$CERT_COUNT" -ge 2 ]; then
    log "OK: Fullchain contains $CERT_COUNT certificates"
else
    error "Fullchain incomplete"
fi

separator

# =========================================================
# Vérification cryptographique
# =========================================================

log "Cryptographic verification with OpenSSL..."

if openssl verify -untrusted "$INTERMEDIATE" "$LEAF"; then
    log "OK: Cryptographic chain validation successful"
else
    error "Cryptographic validation failed"
fi

separator

log "SUCCESS: Certificate chain is valid and fullchain.crt is ready"

separator
