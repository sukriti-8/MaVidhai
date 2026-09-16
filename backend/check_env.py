import sys
import subprocess

def show_pkg(pkg):
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', 'show', pkg], capture_output=True, text=True)
        print(f'--- {pkg} ---')
        print(result.stdout.strip() or 'Not installed')
    except Exception as e:
        print(f'Error checking {pkg}: {e}')

print('Python executable:', sys.executable)
print('Python version:', sys.version)

for pkg in ['fastapi', 'pwdlib', 'argon2-cffi']:
    show_pkg(pkg)
