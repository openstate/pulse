#!/bin/bash

# Set the path to domain-scan.
export DOMAIN_SCAN_PATH=/opt/scan/domain-scan/scan
export DOMAIN_GATHER_PATH=/opt/scan/domain-scan/gather

# go to pulse environment home
cd $HOME/pulse/$PULSE_ENV/current

# load environment and virtualenv
source $HOME/.bashrc
workon pulse-$PULSE_ENV

# run the relevant env-specific data update path
make update_$PULSE_ENV
