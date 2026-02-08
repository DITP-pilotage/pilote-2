import logging
import os


def get_logger(name: str = None) -> logging.Logger:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    # Configuration de base (une seule fois)
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="[%(asctime)s][%(name)s][%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler()],
    )

    logger = logging.getLogger(name)

    return logger
