import os
import tkinter as tk
from tkinter import filedialog
import itertools
import math

required_keywords = 0
image_files = []

def calculate_number_of_keywords(nrimages):
    global required_keywords
    try:
        for n in range(1, nrimages + 1):
            current_factorial = math.factorial(n)
            if (current_factorial >= nrimages):
                required_keywords = n
                keywords_label.config(text=f"Enter at least {required_keywords} keywords (comma-separated):")
                return 
    except ValueError:
        message_label.config(text="Invalid number of images selected.")

def upload_images():
    global image_files
    image_files.clear()
    new_images = filedialog.askopenfilenames()
    image_files.extend(new_images)
    image_count_label.config(text=f"Images: {len(image_files)}")
    calculate_number_of_keywords(len(image_files))

def rename_images():
    if not image_files:
        message_label.config(text="No images to rename.")
        return
    
    if required_keywords == 0:
        message_label.config(text="Keywords error")
        return
    
    keywords = keywords_entry.get().split(',')
    
    if len(keywords) < required_keywords:
        message_label.config(text=f"You need at least {required_keywords} keywords.")
        return
    
    all_combinations = list(itertools.permutations(keywords))
    all_combinations_str = ['_'.join(combo) for combo in all_combinations]

    for i, image_file in enumerate(image_files):
        os.rename(image_file, all_combinations_str[i] + ".jpg")

    image_files.clear()
    message_label.config(text="Image renaming complete!")

root = tk.Tk()
root.title("Photo renaming App")
root.geometry("500x400")  # Increase the size of the GUI window

# Create the file selection button
select_button = tk.Button(root, text="Select Images", command=upload_images)
select_button.pack(pady=10)

# Uploaded images counter
image_count_label = tk.Label(root, text="Images: 0")
image_count_label.pack(pady=10)

# Create the keywords entry field
keywords_label = tk.Label(root, text="Keywords:")
keywords_label.pack(pady=5)
keywords_entry = tk.Entry(root)
keywords_entry.pack(pady=5)

# Rename images
rename_button = tk.Button(root, text="Rename Images", command=rename_images)
rename_button.pack(pady=10)

# Box where the error, succes and other messages appear
message_label = tk.Label(root, text="")
message_label.pack(pady=10)

root.mainloop()