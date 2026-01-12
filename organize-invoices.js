const fs = require('fs');
const path = require('path');

/**
 * Organize renamed invoice PDFs into folder structure: year/month/vendor/
 * 
 * Expected filename format: YYYY-MM-Month_VendorName_€XX.XX_originalname.pdf
 * Output structure: invoices/YYYY/MM/VendorName/filename.pdf
 */

function parseInvoiceFilename(filename) {
    // Remove .pdf extension
    const nameWithoutExt = filename.replace(/\.pdf$/i, '');
    
    // Try to match pattern: YYYY-MM-Month_VendorName_€XX.XX_...
    const pattern = /^(\d{4})-(\d{2})-[A-Za-z]+_([^_]+)_/;
    const match = nameWithoutExt.match(pattern);
    
    if (match) {
        return {
            year: match[1],
            month: match[2],
            vendor: match[3],
            valid: true
        };
    }
    
    // Try alternate pattern without vendor: YYYY-MM-Month_€XX.XX_...
    const altPattern = /^(\d{4})-(\d{2})-[A-Za-z]+_€/;
    const altMatch = nameWithoutExt.match(altPattern);
    
    if (altMatch) {
        return {
            year: altMatch[1],
            month: altMatch[2],
            vendor: 'Unknown',
            valid: true
        };
    }
    
    return { valid: false };
}

function organizeInvoices(sourceFolder, targetFolder) {
    console.log('\n📁 ORGANIZING INVOICES');
    console.log('='.repeat(60));
    console.log(`Source: ${sourceFolder}`);
    console.log(`Target: ${targetFolder}`);
    console.log();
    
    // Get all PDF files in source folder
    const files = fs.readdirSync(sourceFolder)
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .sort();
    
    if (files.length === 0) {
        console.log('❌ No PDF files found in source folder.');
        return;
    }
    
    console.log(`Found ${files.length} PDF files to organize`);
    console.log();
    
    let organized = 0;
    let skipped = 0;
    
    for (const filename of files) {
        const parsed = parseInvoiceFilename(filename);
        
        if (!parsed.valid) {
            console.log(`⚠️  SKIP: ${filename} (doesn't match expected format)`);
            skipped++;
            continue;
        }
        
        // Build target folder path: year/month/vendor
        const targetPath = path.join(
            targetFolder,
            parsed.year,
            parsed.month,
            parsed.vendor
        );
        
        // Create directory structure if it doesn't exist
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
        
        // Move file
        const sourcePath = path.join(sourceFolder, filename);
        const destPath = path.join(targetPath, filename);
        
        try {
            // Check if file already exists in destination
            if (fs.existsSync(destPath)) {
                console.log(`⚠️  EXISTS: ${filename}`);
                console.log(`   → ${path.relative(targetFolder, destPath)}`);
                skipped++;
                continue;
            }
            
            // Try to move, but if cross-device, copy and delete instead
            try {
                fs.renameSync(sourcePath, destPath);
            } catch (moveError) {
                if (moveError.code === 'EXDEV') {
                    // Cross-device, use copy + delete
                    fs.copyFileSync(sourcePath, destPath);
                    fs.unlinkSync(sourcePath);
                } else {
                    throw moveError;
                }
            }
            
            console.log(`✅ MOVED: ${filename}`);
            console.log(`   → ${path.relative(targetFolder, destPath)}`);
            organized++;
        } catch (error) {
            console.error(`❌ ERROR moving ${filename}:`, error.message);
            skipped++;
        }
    }
    
    console.log();
    console.log('='.repeat(60));
    console.log(`✅ Organized: ${organized} files`);
    console.log(`⚠️  Skipped: ${skipped} files`);
    console.log();
    console.log(`📂 Check your organized invoices at: ${targetFolder}`);
}

function showFolderStructure(targetFolder) {
    console.log('\n📊 FOLDER STRUCTURE PREVIEW');
    console.log('='.repeat(60));
    
    if (!fs.existsSync(targetFolder)) {
        console.log('Target folder does not exist yet.');
        return;
    }
    
    // Walk through year folders
    const years = fs.readdirSync(targetFolder)
        .filter(item => fs.statSync(path.join(targetFolder, item)).isDirectory())
        .sort();
    
    for (const year of years) {
        console.log(`📁 ${year}/`);
        
        const yearPath = path.join(targetFolder, year);
        const months = fs.readdirSync(yearPath)
            .filter(item => fs.statSync(path.join(yearPath, item)).isDirectory())
            .sort();
        
        for (const month of months) {
            const monthPath = path.join(yearPath, month);
            const vendors = fs.readdirSync(monthPath)
                .filter(item => fs.statSync(path.join(monthPath, item)).isDirectory())
                .sort();
            
            for (const vendor of vendors) {
                const vendorPath = path.join(monthPath, vendor);
                const files = fs.readdirSync(vendorPath)
                    .filter(file => file.toLowerCase().endsWith('.pdf'));
                
                console.log(`  📁 ${month}/`);
                console.log(`    📁 ${vendor}/ (${files.length} invoice${files.length !== 1 ? 's' : ''})`);
            }
        }
    }
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📄 PDF Invoice Organizer');
        console.log('='.repeat(60));
        console.log('');
        console.log('Usage:');
        console.log('  node organize-invoices.js <source-folder> [target-folder]');
        console.log('');
        console.log('Examples:');
        console.log('  node organize-invoices.js ./downloads');
        console.log('  node organize-invoices.js ./downloads ./invoices');
        console.log('');
        console.log('This will organize PDFs with format:');
        console.log('  YYYY-MM-Month_VendorName_€XX.XX_originalname.pdf');
        console.log('');
        console.log('Into structure:');
        console.log('  invoices/YYYY/MM/VendorName/filename.pdf');
        console.log('');
        return;
    }
    
    const sourceFolder = path.resolve(args[0]);
    const targetFolder = path.resolve(args[1] || path.join(sourceFolder, 'invoices'));
    
    if (!fs.existsSync(sourceFolder)) {
        console.log(`❌ Error: Source folder does not exist: ${sourceFolder}`);
        return;
    }
    
    if (!fs.statSync(sourceFolder).isDirectory()) {
        console.log(`❌ Error: Source path is not a directory: ${sourceFolder}`);
        return;
    }
    
    // Create target folder if it doesn't exist
    if (!fs.existsSync(targetFolder)) {
        console.log(`📁 Creating target folder: ${targetFolder}`);
        fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    // Organize invoices
    organizeInvoices(sourceFolder, targetFolder);
    
    // Show final structure
    showFolderStructure(targetFolder);
}

if (require.main === module) {
    main();
}

module.exports = {
    organizeInvoices,
    parseInvoiceFilename,
    showFolderStructure
};
