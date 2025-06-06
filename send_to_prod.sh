#!/bin/bash

rsync -rtlvz -e "ssh -p 2442" --exclude="venv" --exclude=".git" --exclude="db_data" --exclude=".ruff_cache" --exclude="*.pyc" --exclude="__pycache__" /home/radion/Apps/family_tree/ radion@rbik.site:/home/radion/family_tree
