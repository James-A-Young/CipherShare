#!/bin/bash

# Generate a secure system secret key (32 bytes = 64 hex characters)
echo "Generating secure system secret key..."
node -e "console.log('SYSTEM_SECRET_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
echo ""
echo "Copy the above line to your .env file"
