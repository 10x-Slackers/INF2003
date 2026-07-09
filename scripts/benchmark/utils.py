import os
import platform
import resource
import time
from pathlib import Path
from statistics import mean, pstdev
from typing import Any

ROOT = Path(__file__).resolve().parents[2]


def round_number(value: float | int | None, decimals: int = 2) -> float:
    if value is None:
        return 0
    return round(float(value), decimals)


def summarize_numbers(values: list[float]) -> tuple[float, float]:
    if not values:
        return 0, 0
    return round_number(mean(values)), round_number(pstdev(values))


def diff_counters(before: dict[str, Any], after: dict[str, Any]) -> dict[str, float]:
    return {
        key: value - float(before.get(key, 0))
        for key, value in after.items()
        if isinstance(value, int | float)
    }


def nested_number(data: dict[str, Any], keys: list[str]) -> int | float | None:
    value: Any = data
    for key in keys:
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value if isinstance(value, int | float) else None


def read_system_snapshot() -> dict[str, Any]:
    return {
        "cpu": read_cpu_snapshot(),
        "disk": read_disk_snapshot(),
        "memory": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
        "resource": resource.getrusage(resource.RUSAGE_SELF),
    }


def read_cpu_snapshot() -> dict[str, int] | None:
    try:
        values = [int(value) for value in Path("/proc/stat").read_text().split()[1:11]]
        return {"total": sum(values), "iowait": values[4] if len(values) > 4 else 0}
    except OSError:
        return None


def read_disk_snapshot() -> dict[str, int] | None:
    try:
        devices = {
            path.name
            for path in Path("/sys/block").iterdir()
            if not path.name.startswith(("loop", "ram", "zram", "fd", "sr"))
        }
        totals = {"sectorsRead": 0, "sectorsWritten": 0}
        for line in Path("/proc/diskstats").read_text().splitlines():
            parts = line.split()
            if len(parts) >= 14 and parts[2] in devices:
                totals["sectorsRead"] += int(parts[5])
                totals["sectorsWritten"] += int(parts[9])
        return totals
    except OSError:
        return None


def summarize_system_io(
    before: dict[str, Any], after: dict[str, Any], elapsed_seconds: float
) -> dict[str, float | None]:
    disk = diff_counters(before["disk"] or {}, after["disk"] or {})
    cpu = None
    if before["cpu"] and after["cpu"]:
        cpu = {
            "total": after["cpu"]["total"] - before["cpu"]["total"],
            "iowait": after["cpu"]["iowait"] - before["cpu"]["iowait"],
        }
    read_mb = disk.get("sectorsRead", 0) * 512 / 1024 / 1024
    write_mb = disk.get("sectorsWritten", 0) * 512 / 1024 / 1024
    user_cpu = after["resource"].ru_utime - before["resource"].ru_utime
    system_cpu = after["resource"].ru_stime - before["resource"].ru_stime
    return {
        "readMB": round_number(read_mb),
        "writeMB": round_number(write_mb),
        "readMBps": round_number(read_mb / elapsed_seconds),
        "writeMBps": round_number(write_mb / elapsed_seconds),
        "iowaitPercent": round_number(cpu["iowait"] / cpu["total"] * 100)
        if cpu and cpu["total"]
        else None,
        "processCpuMs": round_number((user_cpu + system_cpu) * 1000),
        "processRssMB": round_number(after["memory"] / 1024),
    }


def environment_lines() -> list[str]:
    total_memory = (
        round_number(
            os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 1024 / 1024
        )
        if hasattr(os, "sysconf")
        else "unknown"
    )
    load_average = (
        ", ".join(str(round_number(value)) for value in os.getloadavg())
        if hasattr(os, "getloadavg")
        else "unknown"
    )
    return [
        f"- Platform: {platform.system().lower()} {platform.release()}",
        f"- CPUs: {os.cpu_count() or 'unknown'} ({platform.processor() or 'unknown'})",
        f"- Total memory: {total_memory} MB",
        f"- Load average: {load_average}",
        f"- Python: {platform.python_version()}",
    ]


def now_ms() -> float:
    return time.perf_counter() * 1000
