import { PreviewShape } from '../PreviewShape/PreviewShape';
import { 
    OPENAI_USER_PROMPT,
    OPENAI_USER_PROMPT_WITH_PREVIOUS_DESIGN,
    OPEN_AI_SYSTEM_PROMPT 
} from '../prompt';

// Import Gemini types
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getHtmlFromGemini({
    image,
	apiKey,
    text,
    grid,
    theme = 'light',
    previousPreviews = [],
}: {
    image: SVGSVGElement;
	apiKey: string;
    text: string;
    theme?: string;
    grid?: {
        color: string;
        size: number;
        labels: boolean;
    };
    previousPreviews?: PreviewShape[];
}) {

	if (!apiKey) throw Error('You need to provide an API key (sorry)');
	console.log("creating a model with the key " + apiKey);
    // Create a Gemini model instance
	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
	
	// Convert SVG to base64 for Gemini Pro
	
	// Next line is the one that's working 
	//const svgBase64 = image.dataset.svg?.toString();
	
	//const svgBase64 = Buffer.from(svgData).toString('base64');
	/*const gemImage = {
		mimeType: "image/svg+xml",
		imageBytes: svgBase64
	};*/

	// Serialize and convert SVG to base64
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(image);
    const svgBase64 = Buffer.from(svgString).toString('base64');

	//but let's try a png
	const base64Png = await convertSvgToPngBase64(image);
	//console.log(base64Png); // Logs the Base64 string of the PNG image

	//const gemImage = {
	//	inlineData: {
	//	  data: svgBase64 /* see JavaScript quickstart for details */,
	//	  mimeType: "image/svg+xml",
//		},
//	  };

	  const gemImage = {
		inlineData: {
		  data: base64Png /* see JavaScript quickstart for details */,
		  mimeType: "image/png",
		},
	  };

	// Prepare the prompt content for Gemini
	let prompt =  OPEN_AI_SYSTEM_PROMPT + "\n"; 
	prompt += (previousPreviews?.length > 0 ? OPENAI_USER_PROMPT_WITH_PREVIOUS_DESIGN : OPENAI_USER_PROMPT) + "\n";

    // Add the text content
    if (text) {
        prompt += `Here's a list of text that we found in the design:\n${text}\n`;
    }

    if (grid) {
        prompt += `The designs have a ${grid.color} grid overlaid on top. Each cell of the grid is ${grid.size}x${grid.size}px.\n`;
    }

    // TODO: I WOULD NEED TO WORK ON THIS A LOT Add previous previews (slightly adjusted format for Gemini)
    for (const preview of previousPreviews) {
        prompt += `Previous design result:\nImage source:\n\nHTML:\n${preview.props.html}\n`; 
    }

    // Add the theme
    prompt += `Please make your result use the ${theme} theme.\n`;
	console.log("Prompt: " + prompt);
    // Generate the response using Gemini
    const result = await model.generateContent([prompt, gemImage]);
	
	// Extract the generated HTML (Gemini may provide additional information)
    //const html = response.candidates[0].output; // Assuming the first candidate is the best
	console.log("Raw result / response from model: " + result.response.text());
	const html = result.response.text(); // Assuming the first candidate is the best
	//let json = JSON.stringify(html);
    return html; // Return in a format similar to OpenAI's response
}


/**
 * Converts an SVG element to a Base64 encoded PNG.
 * @param svgElement The SVG element to convert.
 * @returns A promise that resolves with the Base64 encoded PNG data.
 */
function convertSvgToPngBase64(svgElement: SVGSVGElement): Promise<string> {
    return new Promise((resolve, reject) => {
        // Serialize the SVG element to string
        const svgString = new XMLSerializer().serializeToString(svgElement);

        // Create a new Image element
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');

            if (context === null) {
                reject(new Error('Unable to get canvas context'));
                return;
            }

            // Draw the image onto the canvas
            context.drawImage(img, 0, 0, img.width, img.height);

            // Convert the canvas to a PNG data URL
            const pngDataUrl = canvas.toDataURL("image/png");

            // Convert data URL to base64
            const base64Encoded = pngDataUrl.split(',')[1];
            resolve(base64Encoded);

            // Cleanup
            URL.revokeObjectURL(url);
        };

        img.onerror = () => {
            reject(new Error('Error loading SVG data into image'));
            URL.revokeObjectURL(url);
        };

        // Set the source of the image to the SVG blob URL
        img.src = url;
    });
}

// Example usage:
// Assuming svgElement is the SVG DOM element you want to convert
// convertSvgToPngBase64(svgElement).then(base64Png => {
//     console.log(base64Png); // Logs the Base64 string of the PNG image
// }).catch(error => {
//     console.error('Error converting SVG to PNG:', error);
// });
