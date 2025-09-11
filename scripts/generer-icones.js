const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.join(__dirname, "Composants PILOTE");
const OUTPUT_DIR = path.join(__dirname, "icons");

// Convert filename to PascalCase component name
function filenameToComponentName(filename) {
  const nameWithoutExt = path.parse(filename).name;

  // Remove fr-- prefix if present
  const cleanName = nameWithoutExt.replace(/^fr--/, "");

  // Convert to PascalCase and add Icon suffix
  const componentName =
    cleanName
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("") + "Icon";

  return componentName;
}

// Extract SVG content and modify it
function processSvgContent(svgContent) {
  // Remove width, height, and xmlns attributes, keep viewBox
  let processedSvg = svgContent
    .replace(/\s*width="[^"]*"/g, "")
    .replace(/\s*height="[^"]*"/g, "")
    .replace(/\s*xmlns="[^"]*"/g, "")
    .replace(/\s*fill="none"/g, "")
    .trim();

  // Replace fill colors with currentColor
  processedSvg = processedSvg.replace(/fill="#[^"]*"/g, "fill={fill}");

  // Add stroke support if stroke attributes exist
  if (processedSvg.includes("stroke=")) {
    processedSvg = processedSvg.replace(/stroke="#[^"]*"/g, "stroke={stroke}");
  }

  return processedSvg;
}

// Generate React component content
function generateComponentContent(componentName, svgContent) {
  const hasStroke = svgContent.includes("stroke={stroke}");

  const interfaceProps = hasStroke
    ? `interface ${componentName}Props {
  fill?: string;
  stroke?: string;
  className?: string;
}`
    : `interface ${componentName}Props {
  fill?: string;
  className?: string;
}`;

  const defaultProps = hasStroke
    ? `  fill = 'currentColor',
  stroke = 'currentColor',
  className,`
    : `  fill = 'currentColor',
  className,`;

  return `${interfaceProps}

export const ${componentName} = ({
${defaultProps}
}: ${componentName}Props) => (
  ${svgContent.replace("<svg", "<svg className={className}")}
);
`;
}

// Main function
function generateIcons() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Read all SVG files from source directory
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => path.extname(file).toLowerCase() === ".svg");

  console.log(`Found ${files.length} SVG files to process...`);

  const generatedComponents = [];

  files.forEach((filename) => {
    try {
      const componentName = filenameToComponentName(filename);
      const svgPath = path.join(SOURCE_DIR, filename);
      const svgContent = fs.readFileSync(svgPath, "utf8");

      const processedSvg = processSvgContent(svgContent);
      const componentContent = generateComponentContent(
        componentName,
        processedSvg,
      );

      const outputFilename = `${componentName}.tsx`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);

      fs.writeFileSync(outputPath, componentContent);

      generatedComponents.push({ filename, componentName, outputFilename });

      console.log(` Generated ${outputFilename}`);
    } catch (error) {
      console.error(` Error processing ${filename}:`, error.message);
    }
  });

  // Generate index file for easy imports
  const indexContent =
    generatedComponents
      .map(
        ({ componentName, outputFilename }) =>
          `export { ${componentName} } from './${path.parse(outputFilename).name}';`,
      )
      .join("\n") + "\n";

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexContent);

  console.log(`\n Generated ${generatedComponents.length} icon components`);
  console.log(` Created index.ts with all exports`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
}

// Run the script
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };
