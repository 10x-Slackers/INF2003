import time
from statistics import mean, pstdev


def round_number(value, decimals=2):
    return round(float(value), decimals)


def summarize_numbers(values):
    if not values:
        return 0, 0
    return round_number(mean(values)), round_number(pstdev(values))


def now_ms():
    return time.perf_counter() * 1000
