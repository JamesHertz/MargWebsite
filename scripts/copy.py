#! /usr/bin/env python3

import sys, os, time, signal
from shutil import copy

'''
import sys, getopt

try:
    opts, _ = getopt.getopt(sys.argv[1:], 'i:o:')
except getopt.GetoptError:
    print("script -i <in_dir> -o  <out_dir>")

for opt, value in opts:
    if opt  == '-i':
        in_dir = value
    elif opt == '-o':
        out_dir = value
'''

def bye(a, b):
    print('byebye')
    sys.exit(0)

signal.signal(signal.SIGINT, bye)


argv = sys.argv[1:]

if len(argv) != 2:
    print("script <in_dir> <out_dir>")
    sys.exit(0)

in_dir = argv[0]
out_dir = argv[1]


class fileinfo:
    def __init__(self, fname, mtime):
        self.fname = fname
        self.mtime = mtime

    def fileName(self):
        return f'{in_dir}/{self.fname}'

files = []


with os.scandir(in_dir) as it:
    for e in it:
        if e.is_file():
            files.append(fileinfo(e.name, e.stat().st_mtime_ns))
            print(e.name, 'added!')

print('start monitoring')


while True:

    for f in files:
        mtime = os.stat(f.fileName()).st_mtime_ns
        if mtime != f.mtime:
            f.mtime = mtime
            print(f'{f.fname} was changed')
            copy(f.fileName(), out_dir)

    time.sleep(2)
