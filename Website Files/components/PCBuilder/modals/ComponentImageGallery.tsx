import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { AspectRatio } from "../../ui/aspect-ratio";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageRef } from "../types";
import { getImageUrl, PLACEHOLDER_IMAGE } from "../utils";

interface ComponentImageGalleryProps {
  images: ImageRef[];
  productName: string;
  isCompact?: boolean;
  isModal?: boolean;
}

/**
 * ComponentImageGallery - Interactive image carousel with modal view
 * Supports multiple images, thumbnails, and full-screen gallery
 */
export const ComponentImageGallery = ({
  images,
  productName,
  isCompact = false,
  isModal = false,
}: ComponentImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Normalize to URL strings; fallback to placeholders (up to 4)
  const productImages: string[] =
    images && images.length > 0
      ? images.map(getImageUrl)
      : Array(4).fill(PLACEHOLDER_IMAGE);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
  };

  return (
    <>
      {/* Main product image */}
      <div
        className="relative group cursor-pointer"
        onClick={(e) => {
          // Only open gallery if clicking the image itself, not buttons or overlays
          if (
            e.target === e.currentTarget ||
            (e.target as HTMLElement).tagName === "IMG"
          ) {
            setIsGalleryOpen(true);
          }
        }}
      >
        {isModal ? (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
            <img
              src={productImages[currentImageIndex]}
              alt={productName}
              loading="lazy"
              className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Overlay Controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* View Gallery Button */}
              <div className="absolute top-3 right-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGalleryOpen(true);
                  }}
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Gallery
                </Button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 text-xs"
                >
                  {currentImageIndex + 1}/{productImages.length}
                </Badge>
              </div>

              {/* Navigation arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <AspectRatio
            ratio={isCompact ? 1 : 16 / 9}
            className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900"
          >
            <img
              src={productImages[currentImageIndex]}
              alt={productName}
              width="1920"
              height="1080"
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Overlay Controls */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* View Gallery Button */}
              <div className="absolute top-3 right-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGalleryOpen(true);
                  }}
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Gallery
                </Button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 text-xs"
                >
                  {currentImageIndex + 1}/{productImages.length}
                </Badge>
              </div>

              {/* Navigation arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </AspectRatio>
        )}

        {/* Thumbnail strip for non-compact view */}
        {!isCompact && productImages.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {productImages.slice(0, 3).map((image: string, index: number) => (
              <button
                type="button"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-sky-500 shadow-lg shadow-sky-500/50 scale-105"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width="80"
                  height="80"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen} modal={true}>
        <DialogContent
          className="max-w-5xl bg-black/95 border-white/10 text-white"
          style={{ zIndex: 60 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
              {productName} - Image Gallery
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Browse through multiple high-resolution images of this component
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <AspectRatio ratio={16 / 10} className="overflow-hidden rounded-xl">
              <img
                src={productImages[currentImageIndex]}
                alt={productName}
                width="1200"
                height="750"
                loading="eager"
                className="w-full h-full object-cover"
              />
            </AspectRatio>

            {/* Modal Navigation */}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge
                variant="secondary"
                className="bg-white/15 backdrop-blur-md text-white border-white/20"
              >
                {currentImageIndex + 1} / {productImages.length}
              </Badge>
            </div>
          </div>

          {/* Gallery thumbnails */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {productImages.map((image: string, index: number) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-sky-500 shadow-lg shadow-sky-500/25"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width="200"
                  height="112"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
