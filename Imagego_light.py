import math
from itertools import permutations
from pathlib import Path
from PIL import Image

def resize_image(img, max_size=1600):
    width, height = img.size
    if max(width, height) > max_size:
        if width > height:
            new_width = max_size
            new_height = int((max_size / width) * height)
        else:
            new_height = max_size
            new_width = int((max_size / height) * width)
        return img.resize((new_width, new_height), Image.LANCZOS)
    return img

def convert_images_to_webp():
    current_dir = Path(__file__).parent
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    
    for image_path in current_dir.iterdir():
        if image_path.suffix.lower() in image_extensions:
            webp_path = image_path.with_suffix(".webp")
            
            try:
                with Image.open(image_path) as img:
                    img = resize_image(img)
                    img.save(webp_path, "WEBP", lossless=True)
                print(f"Converted: {image_path.name} -> {webp_path.name}")
            except Exception as e:
                print(f"Error converting {image_path.name}: {e}")

def compress_webp_images():
    current_dir = Path(__file__).parent
    
    for webp_path in current_dir.glob("*.webp"):
        try:
            with Image.open(webp_path) as img:
                img = resize_image(img)
                quality = 100
                while webp_path.stat().st_size > 1_000_000 and quality > 10:
                    img.save(webp_path, "WEBP", lossless=True, quality=quality)
                    quality -= 5
            print(f"Compressed: {webp_path.name}, Final Size: {webp_path.stat().st_size / 1024:.2f} KB")
        except Exception as e:
            print(f"Error compressing {webp_path.name}: {e}")

def calculate_required_keywords(nr_images):
    """Calculate the minimum number of keywords needed such that n! >= nr_images."""
    for n in range(1, nr_images + 1):
        if math.factorial(n) >= nr_images:
            return n

def rename_webp_images():
    """Renames .webp images using permutations of user-provided keywords."""
    current_dir = Path(__file__).parent
    webp_images = list(current_dir.glob("*.webp"))
    nr_images = len(webp_images)

    if nr_images == 0:
        print("No .webp images found.")
        return
    
    # Calculate minimum keywords needed
    required_keywords = calculate_required_keywords(nr_images)
    print(f"You need at least {required_keywords} keywords to generate unique names.")
    
    # Get user input
    keywords = input(f"Enter {required_keywords} unique keywords separated by spaces: ").strip().split()
    
    # Ensure enough unique keywords
    if len(set(keywords)) < required_keywords:
        print(f"Error: You must enter at least {required_keywords} unique keywords.")
        return
    
    # Generate unique names using permutations
    keyword_permutations = list(permutations(keywords))
    
    # Ensure we have enough unique names
    unique_names = ["-".join(p) for p in keyword_permutations[:nr_images]]
    
    # Rename images
    for img_path, new_name in zip(webp_images, unique_names):
        new_img_path = img_path.parent / f"{new_name}.webp"
        img_path.rename(new_img_path)
        print(f"Renamed {img_path.name} -> {new_img_path.name}")

if __name__ == "__main__":
    convert_images_to_webp()
    compress_webp_images()
    rename_webp_images()

