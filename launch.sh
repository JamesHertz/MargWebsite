#! /usr/bin/env bash

START_DIR="website"
SRC_DIR='src'
echo "use the following http://localhost:8000/index.html to have access to the website"
if [[ -e $START_DIR ]]; then
	rm -r $START_DIR/*
else
	mkdir $START_DIR
fi

cp $SRC_DIR/* $START_DIR
cd $START_DIR

node ../fileserver