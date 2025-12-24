const THREE = require("three");
const fs = require("fs");
const path = require("path");

// Load OBJLoader
const OBJLoader = require("three/examples/jsm/loaders/OBJLoader").OBJLoader;
const MTLLoader = require("three/examples/jsm/loaders/MTLLoader").MTLLoader;
const GLTFExporter =
  require("three/examples/jsm/exporters/GLTFExporter").GLTFExporter;

async function convert() {
  const mtlPath = path.join(
    __dirname,
    "public/models/psu/AsusRogThorPlatinum.mtl"
  );
  const objPath = path.join(
    __dirname,
    "public/models/psu/AsusRogThorPlatinum.obj"
  );
  const outputPath = path.join(__dirname, "public/models/psu/asus_rog_psu.glb");

  try {
    const mtlLoader = new MTLLoader();
    const materials = await mtlLoader.loadAsync(mtlPath);
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    const object = await objLoader.loadAsync(objPath);

    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          fs.writeFileSync(outputPath, Buffer.from(result));
          console.log("✓ Converted to GLB:", outputPath);
        }
      },
      { binary: true }
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
}

convert();
