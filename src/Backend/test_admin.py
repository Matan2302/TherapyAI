import hashlib

# Common admin passwords to test
test_passwords = [
    'admin',
    'admin123',
    'password',
    'password123',
    'admin1',
    'admin1@gmail.com',
    'adminPASS123',
    'Admin123',
    'admin@123'
]

stored_hash = 'cdf63004805c249ae25334bbb9b29a09bc9860017ce1c4ee69e4caa3db45cbd3'

print('Testing common passwords:')
for pwd in test_passwords:
    test_hash = hashlib.sha256(pwd.encode()).hexdigest()
    match = test_hash == stored_hash
    print(f'  {pwd:15} -> {test_hash} -> {"✅ MATCH" if match else "❌"}')
    if match:
        print(f'\n🎉 FOUND! The admin password is: {pwd}')
        break
else:
    print('\n❌ None of the common passwords matched.')
    print(f'Stored hash: {stored_hash}')
