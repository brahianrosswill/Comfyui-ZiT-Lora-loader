from .zimage_turbo_lora_loader import ZImageTurboLoraLoader

NODE_CLASS_MAPPINGS = {
    "ZImageTurboLoraLoader": ZImageTurboLoraLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ZImageTurboLoraLoader": "Z-Image Turbo LoRA Loader",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]

print("\033[92m[Z-Image Turbo LoRA]\033[0m Loaded: Z-Image Turbo LoRA Loader")
