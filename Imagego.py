import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
from typing import Tuple
import itertools
import math

class ImageTool(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Imagego")
        self.geometry("800x600")
        self.configure(bg="#f0f2f5")

        # Create notebook for tabs
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(expand=True, fill='both', padx=10, pady=10)

        # Create tabs
        self.resize_frame = ttk.Frame(self.notebook)
        self.rename_frame = ttk.Frame(self.notebook)
        self.convert_frame = ttk.Frame(self.notebook)
        self.compress_frame = ttk.Frame(self.notebook)
        
        self.notebook.add(self.resize_frame, text='Resize Images')
        self.notebook.add(self.rename_frame, text='Rename Images')
        self.notebook.add(self.convert_frame, text='Convert Images')
        self.notebook.add(self.compress_frame, text='Compress Images')

        # Initialize resizer
        self.setup_resizer()
        
        # Initialize renamer
        self.setup_renamer()

        # Initialize converter
        self.setup_converter()

        # Initialize compressor
        self.setup_compressor()

    def setup_resizer(self):
        # Initialize resizer variables
        self.selected_images: Dict[str, Image.Image] = {}
        self.resized_images: Dict[str, Image.Image] = {}
        self.current_preview_index = 0
        self.MAX_SIZE = 1600

         # Style configuration
        style = ttk.Style()
        style.configure("Custom.TButton", padding=10)
        style.configure("Custom.TFrame", background="#f0f2f5")

        # Main frame for resizer
        self.resize_main_frame = ttk.Frame(self.resize_frame, style="Custom.TFrame")
        self.resize_main_frame.pack(expand=True, fill='both', padx=10, pady=10)
        
        # Title
        ttk.Label(
            self.resize_main_frame,
            text="Image Resizer",
            font=("Helvetica", 24, "bold")
        ).pack(pady=(0, 5))
        
        ttk.Label(
            self.resize_main_frame,
            text=f"Resize multiple images to max {self.MAX_SIZE}px on the longest side",
            font=("Helvetica", 12)
        ).pack(pady=(0, 20))

        # Buttons frame
        button_frame = ttk.Frame(self.resize_main_frame)
        button_frame.pack(pady=(0, 20))
        
        self.select_button = ttk.Button(
            button_frame,
            text="Select Images",
            command=self.select_images,
            style="Custom.TButton"
        )
        self.select_button.pack(side="left", padx=5)
        
        self.save_button = ttk.Button(
            button_frame,
            text="Save All Resized Images",
            command=self.save_images,
            style="Custom.TButton",
            state="disabled"
        )
        self.save_button.pack(side="left", padx=5)

        # Navigation frame
        nav_frame = ttk.Frame(self.resize_main_frame)
        nav_frame.pack(pady=(0, 10))
        
        self.prev_button = ttk.Button(
            nav_frame,
            text="← Previous",
            command=self.show_previous_image,
            state="disabled"
        )
        self.prev_button.pack(side="left", padx=5)
        
        self.image_counter = ttk.Label(
            nav_frame,
            text="No images selected"
        )
        self.image_counter.pack(side="left", padx=10)
        
        self.next_button = ttk.Button(
            nav_frame,
            text="Next →",
            command=self.show_next_image,
            state="disabled"
        )
        self.next_button.pack(side="left", padx=5)

        # Images frame
        images_frame = ttk.Frame(self.resize_main_frame)
        images_frame.pack(expand=True, fill='both')
        
        # Original image frame
        self.original_frame = ttk.LabelFrame(images_frame, text="Original Image")
        self.original_frame.grid(row=0, column=0, padx=10, sticky="nsew")
        
        self.original_label = ttk.Label(self.original_frame)
        self.original_label.pack(pady=5)
        
        self.original_info = ttk.Label(
            self.original_frame,
            text="No image selected",
            font=("Helvetica", 10)
        )
        self.original_info.pack(pady=5)

        # Resized image frame
        self.resized_frame = ttk.LabelFrame(images_frame, text="Resized Preview")
        self.resized_frame.grid(row=0, column=1, padx=10, sticky="nsew")
        
        self.resized_label = ttk.Label(self.resized_frame)
        self.resized_label.pack(pady=5)
        
        self.resized_info = ttk.Label(
            self.resized_frame,
            text="No image resized",
            font=("Helvetica", 10)
        )
        self.resized_info.pack(pady=5)

        images_frame.grid_columnconfigure(0, weight=1)
        images_frame.grid_columnconfigure(1, weight=1)

    def setup_renamer(self):
        self.selected_files = []
        self.keywords = []
        
        # Main frame for renamer
        main_frame = ttk.Frame(self.rename_frame, padding="10")
        main_frame.pack(expand=True, fill='both')
        
        # Title
        ttk.Label(
            main_frame,
            text="Image Renamer",
            font=("Helvetica", 24, "bold")
        ).pack(pady=(0, 20))

        # File selection button
        ttk.Button(main_frame, text="Select Photos", command=self.select_files).pack(pady=5)
        
        # Selected files counter
        self.files_label = ttk.Label(main_frame, text="No files selected")
        self.files_label.pack(pady=5)
        
        # Keywords entry with dynamic label
        self.keywords_label = ttk.Label(main_frame, text="Enter keywords (comma-separated):")
        self.keywords_label.pack(pady=5)
        
        self.keyword_entry = ttk.Entry(main_frame, width=50)
        self.keyword_entry.pack(pady=5)
        
        # Preview button
        ttk.Button(main_frame, text="Preview Names", command=self.preview_names).pack(pady=5)
        
        # Preview area
        preview_frame = ttk.Frame(main_frame)
        preview_frame.pack(pady=10, expand=True, fill='both')
        
        # Create preview treeview
        self.preview_tree = ttk.Treeview(preview_frame, columns=("Original", "New"), show="headings")
        self.preview_tree.heading("Original", text="Original Name")
        self.preview_tree.heading("New", text="New Name")
        self.preview_tree.column("Original", width=300)
        self.preview_tree.column("New", width=300)
        self.preview_tree.pack(side=tk.LEFT, expand=True, fill='both')
        
        # Scrollbar for preview
        scrollbar = ttk.Scrollbar(preview_frame, orient=tk.VERTICAL, command=self.preview_tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.preview_tree.configure(yscrollcommand=scrollbar.set)
        
        # Rename button
        ttk.Button(main_frame, text="Rename Files", command=self.rename_files).pack(pady=10)

    def setup_converter(self):
        # Initialize converter variables
        self.convert_images: Dict[str, Image.Image] = {}
        
        # Main frame for converter
        main_frame = ttk.Frame(self.convert_frame, padding="10")
        main_frame.pack(expand=True, fill='both')

        # Title
        ttk.Label(
            main_frame,
            text="Image Converter",
            font=("Helvetica", 24, "bold")
        ).pack(pady=(0, 20))
        
        # Quality slider
        quality_frame = ttk.Frame(main_frame)
        quality_frame.pack(pady=10)
        
        ttk.Label(
            quality_frame,
            text="WebP Quality:",
            font=("Helvetica", 12)
        ).pack(side=tk.LEFT, padx=5)
        
        self.webp_quality = tk.IntVar(value=90)
        quality_slider = ttk.Scale(
            quality_frame,
            from_=1,
            to=100,
            orient=tk.HORIZONTAL,
            variable=self.webp_quality,
            length=200
        )
        quality_slider.pack(side=tk.LEFT, padx=5)
        
        self.quality_label = ttk.Label(
            quality_frame,
            text="90%",
            font=("Helvetica", 12)
        )
        self.quality_label.pack(side=tk.LEFT, padx=5)
        
        def update_quality_label(*args):
            self.quality_label.config(text=f"{self.webp_quality.get()}%")
        
        self.webp_quality.trace_add("write", update_quality_label)

        # Buttons
        ttk.Button(
            main_frame,
            text="Select Images",
            command=self.select_convert_images
        ).pack(pady=10)
        
        self.convert_status = ttk.Label(
            main_frame,
            text="No images selected",
            font=("Helvetica", 12)
        )
        self.convert_status.pack(pady=5)
        
        ttk.Button(
            main_frame,
            text="Convert to WebP",
            command=self.convert_to_webp
        ).pack(pady=10)

    def setup_compressor(self):
        # Initialize compressor variables
        self.compress_images: Dict[str, Image.Image] = {}
        
        # Main frame for compressor
        main_frame = ttk.Frame(self.compress_frame, padding="10")
        main_frame.pack(expand=True, fill='both')
        
        # Title
        ttk.Label(
            main_frame,
            text="Compress WebP Images",
            font=("Helvetica", 24, "bold")
        ).pack(pady=(0, 20))

        # Compression settings frame
        settings_frame = ttk.LabelFrame(main_frame, text="Compression Settings", padding=10)
        settings_frame.pack(fill="x", pady=10, padx=10)

        # Quality slider
        quality_frame = ttk.Frame(settings_frame)
        quality_frame.pack(fill="x", pady=5)
        
        ttk.Label(
            quality_frame,
            text="Compression Quality:",
            font=("Helvetica", 12)
        ).pack(side=tk.LEFT, padx=5)
        
        self.compress_quality = tk.IntVar(value=80)
        quality_slider = ttk.Scale(
            quality_frame,
            from_=1,
            to=100,
            orient=tk.HORIZONTAL,
            variable=self.compress_quality,
            length=200
        )
        quality_slider.pack(side=tk.LEFT, padx=5)
        
        self.compress_quality_label = ttk.Label(
            quality_frame,
            text="80%",
            font=("Helvetica", 12)
        )
        self.compress_quality_label.pack(side=tk.LEFT, padx=5)
        
        def update_compress_quality_label(*args):
            self.compress_quality_label.config(text=f"{self.compress_quality.get()}%")
        
        self.compress_quality.trace_add("write", update_compress_quality_label)

        # Method selection
        method_frame = ttk.Frame(settings_frame)
        method_frame.pack(fill="x", pady=5)
        
        ttk.Label(
            method_frame,
            text="Compression Method:",
            font=("Helvetica", 12)
        ).pack(side=tk.LEFT, padx=5)
        
        self.compress_method = tk.StringVar(value="4")
        methods = [("Fastest", "0"), ("Default", "4"), ("Best", "6")]
        
        for text, value in methods:
            ttk.Radiobutton(
                method_frame,
                text=text,
                value=value,
                variable=self.compress_method
            ).pack(side=tk.LEFT, padx=10)

        # Buttons
        ttk.Button(
            main_frame,
            text="Select WebP Images",
            command=self.select_compress_images
        ).pack(pady=10)
        
        self.compress_status = ttk.Label(
            main_frame,
            text="No images selected",
            font=("Helvetica", 12)
        )
        self.compress_status.pack(pady=5)
        
        ttk.Button(
            main_frame,
            text="Compress Images",
            command=self.compress_webp
        ).pack(pady=10)

    # Resizer methods
    def format_file_size(self, size_in_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB']:
            if size_in_bytes < 1024:
                return f"{size_in_bytes:.1f} {unit}"
            size_in_bytes /= 1024
        return f"{size_in_bytes:.1f} GB"

    def resize_image(self, image: Image.Image) -> Tuple[Image.Image, Tuple[int, int]]:
        width, height = image.size
        
        if width > height and width > self.MAX_SIZE:
            new_width = self.MAX_SIZE
            new_height = int(height * (self.MAX_SIZE / width))
        elif height > self.MAX_SIZE:
            new_height = self.MAX_SIZE
            new_width = int(width * (self.MAX_SIZE / height))
        else:
            return image, (width, height)

        return image.resize((new_width, new_height), Image.Resampling.LANCZOS), (new_width, new_height)

    def update_image_display(self, image_path: str):
        if not image_path:
            self.original_label.configure(image='')
            self.resized_label.configure(image='')
            self.original_info.configure(text="No image selected")
            self.resized_info.configure(text="No image resized")
            return

        # Update original image
        original_image = self.selected_images[image_path]
        width, height = original_image.size
        display_height = 300
        display_width = int(width * (display_height / height))

        display_image = original_image.copy()
        display_image.thumbnail((display_width, display_height))
        self.photo_original = ImageTk.PhotoImage(display_image)
        self.original_label.configure(image=self.photo_original)
        
        size = os.path.getsize(image_path)
        self.original_info.configure(
            text=f"Size: {self.format_file_size(size)}\nDimensions: {width}x{height}px"
        )

        # Update resized image
        resized_image = self.resized_images[image_path]
        width, height = resized_image.size
        display_height = 300
        display_width = int(width * (display_height / height))

        display_image = resized_image.copy()
        display_image.thumbnail((display_width, display_height))
        self.photo_resized = ImageTk.PhotoImage(display_image)
        self.resized_label.configure(image=self.photo_resized)
        
        estimated_size = (width * height * 3) // 8
        self.resized_info.configure(
            text=f"Estimated Size: {self.format_file_size(estimated_size)}\nDimensions: {width}x{height}px"
        )

    def select_images(self):
        file_paths = filedialog.askopenfilenames(
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff"),
                ("All files", "*.*")
            ]
        )
        
        if not file_paths:
            return

        # Clear previous selections
        self.selected_images.clear()
        self.resized_images.clear()
        self.current_preview_index = 0

        # Load and process all selected images
        for file_path in file_paths:
            try:
                original_image = Image.open(file_path)
                self.selected_images[file_path] = original_image
                
                resized_image, _ = self.resize_image(original_image)
                self.resized_images[file_path] = resized_image
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to open image {file_path}: {str(e)}")

        if self.selected_images:
            self.save_button.configure(state="normal")
            self.update_navigation_state()
            self.show_current_image()

    def show_current_image(self):
        if not self.selected_images:
            return

        image_paths = list(self.selected_images.keys())
        current_path = image_paths[self.current_preview_index]
        self.update_image_display(current_path)
        
        self.image_counter.configure(
            text=f"Image {self.current_preview_index + 1} of {len(self.selected_images)}"
        )

    def show_next_image(self):
        if self.current_preview_index < len(self.selected_images) - 1:
            self.current_preview_index += 1
            self.update_navigation_state()
            self.show_current_image()

    def show_previous_image(self):
        if self.current_preview_index > 0:
            self.current_preview_index -= 1
            self.update_navigation_state()
            self.show_current_image()

    def update_navigation_state(self):
        self.prev_button.configure(
            state="normal" if self.current_preview_index > 0 else "disabled"
        )
        self.next_button.configure(
            state="normal" if self.current_preview_index < len(self.selected_images) - 1 else "disabled"
        )

    def save_images(self):
        if not self.selected_images:
            return

        # Ask for output directory
        output_dir = filedialog.askdirectory(title="Select Output Directory")
        if not output_dir:
            return

        success_count = 0
        for file_path, resized_image in self.resized_images.items():
            try:
                # Generate output filename
                filename = os.path.basename(file_path)
                name, ext = os.path.splitext(filename)
                output_path = os.path.join(output_dir, f"{name}_resized{ext}")
                
                # Save the resized image
                resized_image.save(output_path, quality=90, optimize=True)
                success_count += 1
                
            except Exception as e:
                messagebox.showerror(
                    "Error",
                    f"Failed to save {os.path.basename(file_path)}: {str(e)}"
                )

        if success_count > 0:
            messagebox.showinfo(
                "Success",
                f"Successfully saved {success_count} of {len(self.selected_images)} images!"
            )

    # Renamer methods
    def calculate_required_keywords(self, nrimages):
        for n in range(1, nrimages + 1):
            current_factorial = math.factorial(n)
            if (current_factorial >= nrimages):
                return n

    def select_files(self):
        files = filedialog.askopenfilenames(
            title="Select photos",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.gif *.bmp"),
                ("All files", "*.*")
            ]
        )
        self.selected_files = list(files)
        
        num_files = len(self.selected_files)
        if num_files > 0:
            required_keywords = self.calculate_required_keywords(num_files)
            self.files_label.config(text=f"Selected {num_files} files")
            self.keywords_label.config(text=f"Enter at least {required_keywords} keywords (comma-separated):")
        else:
            self.files_label.config(text="No files selected")
            self.keywords_label.config(text="Enter keywords (comma-separated):")
        
        self.preview_names()

    def preview_names(self):
        for item in self.preview_tree.get_children():
            self.preview_tree.delete(item)
        
        keywords = [k.strip() for k in self.keyword_entry.get().split(",") if k.strip()]
        if not keywords:
            return
        
        required_keywords = self.calculate_required_keywords(len(self.selected_files))
        if len(keywords) < required_keywords:
            messagebox.showwarning("Warning", f"Please enter at least {required_keywords} keywords!")
            return
        
        all_combinations = list(itertools.permutations(keywords))
        all_combinations_str = ['_'.join(combo) for combo in all_combinations]

        for i, file_path in enumerate(self.selected_files):
            original_name = os.path.basename(file_path)
            extension = os.path.splitext(original_name)[1]
            new_name = all_combinations_str[i] + extension
            self.preview_tree.insert("", tk.END, values=(original_name, new_name))

    def rename_files(self):
        keywords = [k.strip() for k in self.keyword_entry.get().split(",") if k.strip()]
        if not keywords or not self.selected_files:
            return
        
        required_keywords = self.calculate_required_keywords(len(self.selected_files))
        if len(keywords) < required_keywords:
            messagebox.showwarning("Warning", f"Please enter at least {required_keywords} keywords!")
            return
            
        all_combinations = list(itertools.permutations(keywords))
        all_combinations_str = ['_'.join(combo) for combo in all_combinations]

        for i, file_path in enumerate(self.selected_files):
            directory = os.path.dirname(file_path)
            original_name = os.path.basename(file_path)
            extension = os.path.splitext(original_name)[1]
            new_name = all_combinations_str[i] + extension
            new_path = os.path.join(directory, new_name)
            
            try:
                os.rename(file_path, new_path)
            except OSError as e:
                messagebox.showerror("Error", f"Failed to rename {original_name}: {str(e)}")
        
        messagebox.showinfo("Success", "Files renamed successfully!")
        self.preview_names()

    #Converter methods
    def select_convert_images(self):
        file_paths = filedialog.askopenfilenames(
            title="Select Images to Convert",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.gif *.tiff"),
                ("All files", "*.*")
            ]
        )
        
        if not file_paths:
            return

        self.convert_images.clear()
        
        for file_path in file_paths:
            try:
                image = Image.open(file_path)
                self.convert_images[file_path] = image
            except Exception as e:
                messagebox.showerror("Error", f"Failed to open {file_path}: {str(e)}")

        self.convert_status.config(
            text=f"Selected {len(self.convert_images)} images"
        )

    def convert_to_webp(self):
        if not self.convert_images:
            messagebox.showwarning("Warning", "Please select images first!")
            return

        output_dir = filedialog.askdirectory(title="Select Output Directory")
        if not output_dir:
            return

        success_count = 0
        quality = self.webp_quality.get()

        for file_path, image in self.convert_images.items():
            try:
                filename = os.path.basename(file_path)
                name = os.path.splitext(filename)[0]
                output_path = os.path.join(output_dir, f"{name}.webp")
                
                image.save(
                    output_path,
                    format="WebP",
                    quality=quality,
                    method=4  # Default compression method
                )
                success_count += 1
                
            except Exception as e:
                messagebox.showerror(
                    "Error",
                    f"Failed to convert {filename}: {str(e)}"
                )

        if success_count > 0:
            messagebox.showinfo(
                "Success",
                f"Successfully converted {success_count} of {len(self.convert_images)} images to WebP!"
            )

    #Compressor methods
    def select_compress_images(self):
        file_paths = filedialog.askopenfilenames(
            title="Select WebP Images to Compress",
            filetypes=[
                ("WebP files", "*.webp"),
                ("All files", "*.*")
            ]
        )
        
        if not file_paths:
            return

        self.compress_images.clear()
        
        for file_path in file_paths:
            try:
                image = Image.open(file_path)
                if image.format != "WEBP":
                    raise ValueError("Not a WebP image")
                self.compress_images[file_path] = image
            except Exception as e:
                messagebox.showerror("Error", f"Failed to open {file_path}: {str(e)}")

        self.compress_status.config(
            text=f"Selected {len(self.compress_images)} WebP images"
        )

    def compress_webp(self):
        if not self.compress_images:
            messagebox.showwarning("Warning", "Please select WebP images first!")
            return

        output_dir = filedialog.askdirectory(title="Select Output Directory")
        if not output_dir:
            return

        success_count = 0
        quality = self.compress_quality.get()
        method = int(self.compress_method.get())

        for file_path, image in self.compress_images.items():
            try:
                filename = os.path.basename(file_path)
                name = os.path.splitext(filename)[0]
                output_path = os.path.join(output_dir, f"{name}_compressed.webp")
                
                image.save(
                    output_path,
                    format="WebP",
                    quality=quality,
                    method=method,
                    lossless=False
                )
                success_count += 1
                
            except Exception as e:
                messagebox.showerror(
                    "Error",
                    f"Failed to compress {filename}: {str(e)}"
                )

        if success_count > 0:
            messagebox.showinfo(
                "Success",
                f"Successfully compressed {success_count} of {len(self.compress_images)} WebP images!"
            )

if __name__ == "__main__":
    app = ImageTool()
    app.mainloop()
