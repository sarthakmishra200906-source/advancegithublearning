a = int(input("Enter a number: "))
b = int(input("Enter another number: "))

prime_count = 0

for i in range(a, b + 1):
    if i < 2:
        continue  # Numbers less than 2 are not prime
    
    factors = 0
    for j in range(1, i + 1):
        if i % j == 0:
            factors += 1
            
    # Check after testing all divisors of 'i'
    if factors == 2:
        prime_count += 1

print("Number of prime numbers between", a, "and", b, "is", prime_count)