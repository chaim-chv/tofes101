---
id: source/id-checksum-reference
title: Israeli ID number — check-digit algorithm (technical reference)
type: source
status: verified
confidence: likely
authority: secondary
publisher: itsbaba.com / public implementations
url: https://www.itsbaba.com/israeli-id-validator
retrieved: 2026-10-29
updated: 2026-10-29
tags: [source, id-number, validation, algorithm]
---

# Israeli ID check digit

The 9-digit Israeli ID (מספר זהות) ends in a check digit computed by a Luhn-like
algorithm: left-pad to 9 digits, multiply digits alternately by 1 and 2 from the
left, sum the decimal digits of each product, and require the total mod 10 = 0.
Equivalent formulation: check digit = (10 − sum mod 10) mod 10. The same
algorithm is widely implemented; it detects typing errors only, not whether the
number exists or belongs to the person. Do **not** apply it to employer deduction
file numbers without confirming their own format.
