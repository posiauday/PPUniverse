# @ppu/adapter-scanning

`ScanAdapter` — the malware-scanning port (MVP-006). `ClamavScanAdapter` is the real implementation, talking to clamd's `INSTREAM` protocol directly over TCP (development/CI; a dedicated asynchronous production scanning service is still to be selected, `docs/final-decisions.md` / `planning/tech-debt/TD-004.md`). `FakeScanAdapter` is a fake for fast unit tests, including the real EICAR test string for exercising the "infected" path without needing a live scanner.
