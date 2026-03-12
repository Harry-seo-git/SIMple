/**
 * SIMple Figma Plugin - Main Code (runs in Figma sandbox)
 *
 * This plugin connects to the SIMple web app to browse
 * and insert AI-generated graphic assets into Figma designs.
 */

// Plugin commands
figma.showUI(__html__, {
  width: 360,
  height: 520,
  themeColors: true,
  title: "SIMple",
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "insert-svg": {
      await insertSVG(msg.svgCode, msg.name);
      break;
    }

    case "insert-image": {
      await insertImage(msg.imageBytes, msg.name, msg.width, msg.height);
      break;
    }

    case "get-selection": {
      const selection = figma.currentPage.selection;
      figma.ui.postMessage({
        type: "selection",
        count: selection.length,
        nodes: selection.map((n) => ({
          id: n.id,
          name: n.name,
          type: n.type,
        })),
      });
      break;
    }

    case "get-user": {
      const user = figma.currentUser;
      figma.ui.postMessage({
        type: "user",
        name: user?.name || "Unknown",
        photoUrl: user?.photoUrl,
      });
      break;
    }

    case "resize": {
      figma.ui.resize(msg.width, msg.height);
      break;
    }

    case "close": {
      figma.closePlugin();
      break;
    }

    case "notify": {
      figma.notify(msg.message, { timeout: msg.timeout || 3000 });
      break;
    }
  }
};

/**
 * Insert SVG code as a Figma node
 */
async function insertSVG(svgCode: string, name: string = "SIMple Asset") {
  try {
    const node = figma.createNodeFromSvg(svgCode);
    node.name = name;

    // Position at center of viewport
    const viewport = figma.viewport.center;
    node.x = viewport.x - node.width / 2;
    node.y = viewport.y - node.height / 2;

    // Select the new node
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);

    figma.ui.postMessage({
      type: "insert-success",
      nodeId: node.id,
      name: node.name,
    });

    figma.notify(`"${name}" inserted successfully!`);
  } catch (err) {
    figma.ui.postMessage({
      type: "insert-error",
      error: String(err),
    });
    figma.notify("Failed to insert SVG", { error: true });
  }
}

/**
 * Insert a raster image as a Figma rectangle with image fill
 */
async function insertImage(
  imageBytes: Uint8Array,
  name: string = "SIMple Asset",
  width: number = 400,
  height: number = 400
) {
  try {
    const image = figma.createImage(imageBytes);
    const rect = figma.createRectangle();
    rect.name = name;
    rect.resize(width, height);
    rect.fills = [
      {
        type: "IMAGE",
        scaleMode: "FILL",
        imageHash: image.hash,
      },
    ];

    // Position at center of viewport
    const viewport = figma.viewport.center;
    rect.x = viewport.x - width / 2;
    rect.y = viewport.y - height / 2;

    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);

    figma.ui.postMessage({
      type: "insert-success",
      nodeId: rect.id,
      name: rect.name,
    });

    figma.notify(`"${name}" inserted successfully!`);
  } catch (err) {
    figma.ui.postMessage({
      type: "insert-error",
      error: String(err),
    });
    figma.notify("Failed to insert image", { error: true });
  }
}

/**
 * Create a SIMple component set from multiple assets
 */
async function createComponentSet(
  assets: { svgCode: string; name: string }[]
) {
  const components: ComponentNode[] = [];

  for (const asset of assets) {
    try {
      const node = figma.createNodeFromSvg(asset.svgCode);
      const component = figma.createComponent();
      component.name = asset.name;
      component.resize(node.width, node.height);

      // Move SVG children into component
      for (const child of [...node.children]) {
        component.appendChild(child);
      }
      node.remove();

      components.push(component);
    } catch {
      // Skip failed SVGs
    }
  }

  if (components.length > 0) {
    // Arrange in a grid
    const cols = Math.ceil(Math.sqrt(components.length));
    const spacing = 40;
    components.forEach((comp, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      comp.x = col * (comp.width + spacing);
      comp.y = row * (comp.height + spacing);
    });

    figma.currentPage.selection = components;
    figma.viewport.scrollAndZoomIntoView(components);

    figma.notify(`${components.length} components created!`);
  }
}
