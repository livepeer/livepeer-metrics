#!/bin/bash
GLOBALNODE=/usr/local/bin/node

if [ ! -f $GLOBALNODE ]; then
  echo "Not exists"
  sudo ln -s `which node` $GLOBALNODE
fi

sudo cp 10-livemetrics.conf /etc/rsyslog.d/
sudo cp livemetrics /etc/logrotate.d/
sudo systemctl restart rsyslog

sudo systemctl status livemetrics.service
if [ $? -eq 0 ]; then
    echo "Already installed"
    exit 1
fi
sudo cp livemetrics.service /lib/systemd/system/
sudo systemctl enable livemetrics.service
sudo systemctl status livemetrics.service
