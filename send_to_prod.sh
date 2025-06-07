#!/bin/bash

rsync -rtlvz -e "ssh -p 2442" --exclude="venv" --exclude=".git" --exclude="db_data" --exclude=".ruff_cache" --exclude="*.pyc" --exclude="__pycache__" --exclude="logs" . radion@rbik.site:~/family_tree
