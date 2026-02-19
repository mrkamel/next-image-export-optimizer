/* eslint-disable no-undef */
const { getExportedImageProps } = require("../example/src/ExportedImage.tsx");

describe("getExportedImageProps", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    test("returns Next.js image optimization endpoint for string src", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      expect(result.props.src).toContain("/_next/image?url=");
      expect(result.props.src).toContain(encodeURIComponent("/images/test.jpg"));
      expect(result.props.srcSet).toContain("/_next/image?url=");
      expect(result.props.sizes).toBe("100vw");
    });

    test("adds leading slash to src if missing", () => {
      const result = getExportedImageProps({
        src: "images/test.jpg",
      });

      expect(result.props.src).toContain(encodeURIComponent("/images/test.jpg"));
    });

    test("includes width and height when provided", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
        width: 800,
        height: 600,
      });

      expect(result.props.width).toBe(800);
      expect(result.props.height).toBe(600);
    });

    test("uses custom sizes when provided", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
        sizes: "(max-width: 768px) 100vw, 50vw",
      });

      expect(result.props.sizes).toBe("(max-width: 768px) 100vw, 50vw");
    });

    test("extracts dimensions from static image", () => {
      const staticImage = {
        src: "/_next/static/media/test.abc123.jpg",
        width: 1920,
        height: 1080,
      };

      const result = getExportedImageProps({
        src: staticImage,
      });

      expect(result.props.width).toBe(1920);
      expect(result.props.height).toBe(1080);
    });

    test("uses provided width/height over static image dimensions", () => {
      const staticImage = {
        src: "/_next/static/media/test.abc123.jpg",
        width: 1920,
        height: 1080,
      };

      const result = getExportedImageProps({
        src: staticImage,
        width: 800,
        height: 600,
      });

      expect(result.props.width).toBe(800);
      expect(result.props.height).toBe(600);
    });

    test("generates srcSet with all default sizes", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      const defaultSizes = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

      defaultSizes.forEach(size => {
        expect(result.props.srcSet).toContain(`w=${size}`);
        expect(result.props.srcSet).toContain(`${size}w`);
      });
    });
  });

  describe("production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      process.env.nextImageExportOptimizer_storePicturesInWEBP = "true";
      process.env.nextImageExportOptimizer_outputFolderPath = "public/output";
      process.env.nextImageExportOptimizer_imageFolderPath = "public/images";
    });

    test("returns optimized image URL for string src", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      expect(result.props.src).toContain("-opt-");
      expect(result.props.src).toContain("webp");
      expect(result.props.srcSet).toContain("-opt-");
    });

    test("generates optimized srcSet with all sizes", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      const defaultSizes = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

      defaultSizes.forEach(size => {
        expect(result.props.srcSet).toContain(`-opt-${size}.webp ${size}w`);
      });
    });

    test("limits srcSet sizes for static images based on original width", () => {
      const staticImage = {
        src: "/_next/static/media/test.abc123.jpg",
        width: 500,
        height: 300,
      };

      const result = getExportedImageProps({
        src: staticImage,
      });

      // Should not include sizes larger than the next size >= 500 (which is 640)
      expect(result.props.srcSet).not.toContain("-opt-750.");
      expect(result.props.srcSet).not.toContain("-opt-1080.");
      expect(result.props.srcSet).not.toContain("-opt-3840.");

      // Should include smaller sizes
      expect(result.props.srcSet).toContain("-opt-256.");
      expect(result.props.srcSet).toContain("-opt-384.");
    });

    test("handles remote images (http URLs)", () => {
      const result = getExportedImageProps({
        src: "https://example.com/image.jpg",
      });

      expect(result.props.src).toContain("-opt-");
      expect(result.props.src).toContain("/remoteImages/");
      expect(result.props.srcSet).toContain("/remoteImages/");
    });

    test("uses basePath when provided", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
        basePath: "/subsite",
      });

      expect(result.props.src).toContain("/subsite/");
      expect(result.props.srcSet).toContain("/subsite/");
    });

    test("preserves original extension when storePicturesInWEBP is false", () => {
      process.env.nextImageExportOptimizer_storePicturesInWEBP = "false";

      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      expect(result.props.src).toContain(".jpg");
      expect(result.props.src).not.toContain(".webp");
    });

    test("handles static images from _next/static/media", () => {
      const staticImage = {
        src: "/_next/static/media/photo.abc123.jpg",
        width: 1920,
        height: 1080,
      };

      const result = getExportedImageProps({
        src: staticImage,
      });

      expect(result.props.src).toContain("/_next/static/media/");
      expect(result.props.src).toContain("-opt-");
    });

    test("handles images in subfolders", () => {
      const result = getExportedImageProps({
        src: "/images/subfolder/test.jpg",
      });

      expect(result.props.src).toContain("/subfolder/");
      expect(result.props.src).toContain("-opt-");
    });

    test("handles custom exportFolderName", () => {
      process.env.nextImageExportOptimizer_outputFolderPath = "public/customFolder";

      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      expect(result.props.src).toContain("/customFolder/");
    });
  });

  describe("unoptimized mode", () => {
    test("uses Next.js image endpoint when unoptimized is true in production", () => {
      process.env.NODE_ENV = "production";

      const result = getExportedImageProps({
        src: "/images/test.jpg",
        unoptimized: true,
      });

      expect(result.props.src).toContain("/_next/image?url=");
      expect(result.props.srcSet).toContain("/_next/image?url=");
    });
  });

  describe("return structure", () => {
    test("returns correct shape with all options", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
        width: 800,
        height: 600,
        sizes: "50vw",
      });

      expect(result).toHaveProperty("props");
      expect(result.props).toHaveProperty("src");
      expect(result.props).toHaveProperty("srcSet");
      expect(result.props).toHaveProperty("sizes");
      expect(result.props.width).toBe(800);
      expect(result.props.height).toBe(600);
    });

    test("omits width/height when not provided and not static image", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      expect(result.props.width).toBeUndefined();
      expect(result.props.height).toBeUndefined();
    });

    test("defaults sizes to 100vw", () => {
      const result = getExportedImageProps({
        src: "/images/test.jpg",
      });

      expect(result.props.sizes).toBe("100vw");
    });
  });
});
