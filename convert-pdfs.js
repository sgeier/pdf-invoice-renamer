require('dotenv').config();

const pdf = require('pdf-poppler');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Define month mapping
const monthNames = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

async function convertPDFsToImages(folderPath) {
    console.log(`\n📄 Converting PDFs to images in: ${folderPath}`);
    console.log('='.repeat(50));
    
    // Get all PDF files in the specified directory
    const files = fs.readdirSync(folderPath)
        .filter(file => file.endsWith('.pdf'))
        .sort();
    
    if (files.length === 0) {
        console.log('❌ No PDF files found in the specified directory.');
        return [];
    }
    
    console.log(`Found ${files.length} PDF files:`, files);
    
    // Create output directory for images
    const imagesDir = path.join(folderPath, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    
    const convertedFiles = [];
    
    for (const file of files) {
        try {
            console.log(`\n🔄 Converting first page of ${file}...`);
            
            const filePath = path.join(folderPath, file);
            const baseFilename = path.parse(file).name;
            
            // Configure pdf-poppler options
            const options = {
                format: 'jpeg',
                out_dir: imagesDir,
                out_prefix: baseFilename,
                page: 1,               // Only convert first page
                single_file: true      // Create single file, not multiple
            };
            
            // Convert PDF to image
            await pdf.convert(filePath, options);
            
            const imagePath = path.join(imagesDir, `${baseFilename}-1.jpg`);
            convertedFiles.push({
                pdfFile: file,
                imagePath: imagePath,
                baseFilename: baseFilename
            });
            
            console.log(`✅ Successfully converted: ${baseFilename}-1.jpg`);
            
        } catch (error) {
            console.error(`❌ Error converting ${file}:`, error.message);
        }
    }
    
    return convertedFiles;
}

async function analyzeImageWithOpenAI(imagePath) {
    try {
        console.log(`🔍 Analyzing image: ${path.basename(imagePath)}`);
        
        // Read image file and convert to base64
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `This is an invoice image. Please analyze it and extract two pieces of information:

1. INVOICE DATE: Find the date when this invoice was issued or created. This should be the billing/invoice date, not a due date or delivery date.

2. TOTAL AMOUNT: Find the final total amount that needs to be paid, including all taxes and fees. This should be the main total amount, not subtotals or individual line items.

Return your response in this JSON format:
{
  "date": "YYYY-MM-DD",
  "total": "XX.XX"
}

Notes:
- For date: Return only in YYYY-MM-DD format, or null if not found
- For total: Return only the numeric value with 2 decimal places (no currency symbols), or null if not found
- Focus on the most prominent total amount on the invoice`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 100,
            response_format: { type: "json_object" }
        });
        
        const responseText = response.choices[0]?.message?.content?.trim();
        
        try {
            const parsedResponse = JSON.parse(responseText);
            
            // Validate the response structure
            if (typeof parsedResponse === 'object' && parsedResponse !== null) {
                const result = {
                    date: null,
                    total: null
                };
                
                // Validate date
                if (parsedResponse.date && typeof parsedResponse.date === 'string') {
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (dateRegex.test(parsedResponse.date)) {
                        const testDate = new Date(parsedResponse.date);
                        if (testDate instanceof Date && !isNaN(testDate)) {
                            result.date = parsedResponse.date;
                        }
                    }
                }
                
                // Validate total
                if (parsedResponse.total && (typeof parsedResponse.total === 'string' || typeof parsedResponse.total === 'number')) {
                    const totalStr = String(parsedResponse.total);
                    const totalRegex = /^\d+\.?\d*$/;
                    if (totalRegex.test(totalStr) && !isNaN(parseFloat(totalStr))) {
                        result.total = parseFloat(totalStr).toFixed(2);
                    }
                }
                
                console.log(`✅ Extracted - Date: ${result.date || 'N/A'}, Total: ${result.total || 'N/A'}`);
                return result;
            }
        } catch (parseError) {
            console.log(`⚠️ Could not parse JSON response: ${responseText}`);
        }
        
        console.log(`⚠️ Could not extract valid data from response: ${responseText}`);
        return { date: null, total: null };
        
    } catch (error) {
        console.error(`❌ Error analyzing image ${imagePath}:`, error.message);
        return { date: null, total: null };
    }
}

async function extractDataFromImages(convertedFiles) {
    console.log('\n🤖 Analyzing images with OpenAI GPT-4o-mini');
    console.log('='.repeat(50));
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('❌ Error: OpenAI API key not set');
        console.log('Please:');
        console.log('1. Copy env.example to .env');
        console.log('2. Add your OpenAI API key to the .env file');
        console.log('3. Restart the script');
        return {};
    }
    
    const invoiceData = {};
    
    for (const fileInfo of convertedFiles) {
        const extractedData = await analyzeImageWithOpenAI(fileInfo.imagePath);
        
        if (extractedData.date || extractedData.total) {
            invoiceData[fileInfo.pdfFile] = extractedData;
            console.log(`📝 ${fileInfo.pdfFile} → Date: ${extractedData.date || 'N/A'}, Total: ${extractedData.total || 'N/A'}`);
        } else {
            console.log(`❌ Failed to extract data from ${fileInfo.pdfFile}`);
        }
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return invoiceData;
}

async function renamePDFsWithData(folderPath, invoiceData) {
    console.log('\n🏷️  RENAMING PDFs');
    console.log('='.repeat(50));
    
    for (const [originalName, data] of Object.entries(invoiceData)) {
        try {
            const originalPath = path.join(folderPath, originalName);
            
            // Check if original file exists
            if (!fs.existsSync(originalPath)) {
                console.log(`⚠️  File not found: ${originalName}`);
                continue;
            }
            
            // Start building the new filename
            const baseName = path.parse(originalName).name;
            let newName = '';
            
            // Add date prefix if available
            if (data.date) {
                const date = new Date(data.date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const monthName = monthNames[month];
                newName += `${year}-${month}-${monthName}_`;
            }
            
            // Add total price if available
            if (data.total) {
                newName += `€${data.total}_`;
            }
            
            // Add original base name
            newName += `${baseName}.pdf`;
            
            // If no data was extracted, keep original name
            if (!data.date && !data.total) {
                console.log(`⚠️  No data extracted for ${originalName}, keeping original name`);
                continue;
            }
            
            const newPath = path.join(folderPath, newName);
            
            // Rename the file
            fs.renameSync(originalPath, newPath);
            
            console.log(`✅ Renamed:`);
            console.log(`   From: ${originalName}`);
            console.log(`   To:   ${newName}`);
            
        } catch (error) {
            console.error(`❌ Error renaming ${originalName}:`, error.message);
        }
    }
}

async function main() {
    const mode = process.argv[3] || 'auto'; // 'convert', 'rename', or 'auto'
    const folderPath = path.resolve(process.argv[2] || '.');
    
    if (!fs.existsSync(folderPath)) {
        console.log(`❌ Error: Folder does not exist: ${folderPath}`);
        return;
    }
    
    if (!fs.statSync(folderPath).isDirectory()) {
        console.log(`❌ Error: Path is not a directory: ${folderPath}`);
        return;
    }
    
    if (mode === 'convert') {
        // Convert mode - just convert PDFs to images
        console.log('🚀 PDF to Image Converter');
        console.log('='.repeat(50));
        
        const convertedFiles = await convertPDFsToImages(folderPath);
        
        if (convertedFiles.length === 0) {
            console.log('❌ No files were converted.');
            return;
        }
        
        console.log('\n🎉 CONVERSION COMPLETE!');
        console.log('='.repeat(50));
        console.log('✅ PDFs converted to images');
        console.log(`📁 Images location: ${path.join(folderPath, 'images')}`);
        console.log('\n📋 Summary of converted files:');
        convertedFiles.forEach(file => {
            console.log(`   ${file.pdfFile} → ${file.baseFilename}-1.jpg`);
        });
        
    } else if (mode === 'rename') {
        // Rename mode - rename PDFs with provided dates
        const datesArg = process.argv[4];
        if (!datesArg) {
            console.log('❌ Error: Dates object required for rename mode');
            console.log('Usage: node convert-pdfs.js <folder> rename <dates-json>');
            return;
        }
        
        try {
            const invoiceData = JSON.parse(datesArg);
            await renamePDFsWithData(folderPath, invoiceData);
            
            console.log('\n🎉 RENAMING COMPLETE!');
            console.log('='.repeat(50));
            console.log('✅ PDFs renamed with date and price information');
            
        } catch (error) {
            console.error('❌ Error parsing dates:', error.message);
        }
        
    } else if (mode === 'auto') {
        // Auto mode - convert PDFs, analyze with AI, and rename
        console.log('🚀 PDF Converter & AI Analyzer');
        console.log('='.repeat(50));
        console.log('This will:');
        console.log('1. Convert PDFs to images');
        console.log('2. Analyze images with OpenAI GPT-4o-mini');
        console.log('3. Extract invoice dates and total amounts');
        console.log('4. Rename PDFs with date and price information');
        
        // Step 1: Convert PDFs to images
        const convertedFiles = await convertPDFsToImages(folderPath);
        
        if (convertedFiles.length === 0) {
            console.log('❌ No files were converted.');
            return;
        }
        
        // Step 2: Extract dates using OpenAI GPT-4o-mini
        const invoiceData = await extractDataFromImages(convertedFiles);
        
        if (Object.keys(invoiceData).length === 0) {
            console.log('❌ No data was extracted. Check your OpenAI API key and try again.');
            return;
        }
        
        // Step 3: Rename PDFs with extracted dates
        await renamePDFsWithData(folderPath, invoiceData);
        
        console.log('\n🎉 ALL DONE!');
        console.log('='.repeat(50));
        console.log('✅ PDFs converted to images');
        console.log('✅ Dates and totals extracted with AI');
        console.log('✅ PDFs renamed with date and price information');
        console.log(`📁 Check your folder: ${folderPath}`);
        
    }
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

// Export functions for external use
module.exports = {
    convertPDFsToImages,
    analyzeImageWithOpenAI,
    extractDataFromImages,
    renamePDFsWithData,
    monthNames
}; 