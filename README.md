# 📄 Smart PDF Invoice Organizer

**Automatically convert, analyze, and rename PDF invoices with AI-powered date and price extraction**

Transform your messy invoice files from cryptic names like `694c1fcd-70cb-4346-a23d-1ab6bdcdd0fd.pdf` into organized, searchable files like `2023-07-Jul_€29.99_694c1fcd-70cb-4346-a23d-1ab6bdcdd0fd.pdf` - completely automatically!

## ✨ Features

- 🔄 **PDF to Image Conversion**: Converts first page of PDFs to high-quality JPEG images
- 🤖 **AI-Powered Data Extraction**: Uses OpenAI GPT-4o-mini Vision to read and extract invoice dates AND total prices
- 💰 **Smart Price Detection**: Automatically identifies final total amounts including taxes and fees
- 🏷️ **Enhanced Renaming**: Automatically renames files with `YYYY-MM-Month_€XX.XX_originalname.pdf` format
- 📁 **Batch Processing**: Process entire directories of invoices at once
- 🌍 **Multi-language Support**: Works with invoices in multiple languages (English, German, etc.)
- ⚡ **Fast & Reliable**: Processes dozens of files efficiently with rate limiting
- 💰 **Cost-Effective**: Uses GPT-4o-mini for affordable AI processing
- 🔍 **Easy Searching**: Find invoices by price range, date, or month instantly

## 🖼️ Screenshots

### Before: Messy Invoice Filenames
![Before Screenshot](screenshots/before-conversion.png)
*Invoices with cryptic, unsearchable filenames*

### After: Organized with Dates AND Prices
![After Screenshot](screenshots/after-conversion.png)
*Same invoices now organized chronologically with readable dates and total amounts*

### Terminal Output During Processing
![Terminal Screenshot](screenshots/terminal-output.png)
*Real-time processing showing conversion, AI analysis, and renaming with both dates and prices*

## 🚀 How It Works

1. **Convert**: Transforms PDF first pages into JPEG images
2. **Analyze**: Sends images to OpenAI Vision API to extract invoice dates AND total amounts
3. **Rename**: Automatically renames PDFs with extracted date and price information

The tool intelligently identifies:
- **Invoice dates**: Billing/invoice dates (not due dates or other irrelevant dates)
- **Total amounts**: Final amounts to be paid including all taxes and fees (not subtotals or line items)

## 📋 Prerequisites

- Node.js (v14 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sgeier/pdf-invoice-renamer.git
   cd pdf-invoice-renamer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your OpenAI API key**
   
   **Copy the environment template:**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Windows
   copy env.example .env
   ```
   
   **Edit the .env file:**
   Open `.env` and replace `your-openai-api-key-here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
   
   **Get your API key**: Visit [OpenAI API Keys](https://platform.openai.com/api-keys) to create one.
   
   **Alternative - Use the setup script (Windows):**
   ```bash
   setup-env.bat
   ```
   This will guide you through creating the .env file interactively.

## 🎯 Usage

### Single Directory Processing
```bash
node convert-pdfs.js "path/to/invoice/folder"
```

### Multiple Files in One Directory
The script processes all PDF files in the specified directory:
```bash
node convert-pdfs.js "path/to/invoice/folder"
```

### Mode Options
```bash
# Full automatic processing (default) - extracts dates AND prices
node convert-pdfs.js "folder" auto

# Convert to images only
node convert-pdfs.js "folder" convert

# Rename with provided data (legacy mode)
node convert-pdfs.js "folder" rename '{"file1.pdf":{"date":"2024-03-15","total":"29.99"}}'
```

## 📊 Example Results

| Original Filename | Extracted Date | Extracted Price | New Filename |
|-------------------|----------------|------------------|--------------|
| `694c1fcd-70cb-4346-a23d-1ab6bdcdd0fd.pdf` | July 2, 2023 | €29.99 | `2023-07-Jul_€29.99_694c1fcd-70cb-4346-a23d-1ab6bdcdd0fd.pdf` |
| `invoice-04029-30703330.pdf` | March 15, 2024 | €156.80 | `2024-03-Mar_€156.80_invoice-04029-30703330.pdf` |
| `Made_With_AI_164359013.pdf` | January 8, 2023 | €11.99 | `2023-01-Jan_€11.99_Made_With_AI_164359013.pdf` |

### Real-World Example from Google Invoices:
```
Before: "1079562573546578-33.pdf"
After:  "2022-07-Jul_€11.99_1079562573546578-33.pdf"

Before: "619935639187-228.pdf" 
After:  "2022-03-Mar_€36.99_619935639187-228.pdf"
```

## 🔍 Search Benefits

With the new naming format, you can easily:
- **Find expensive invoices**: Search for "€1" to find invoices over € 100
- **Find by price range**: Search "€2.99" to find cheap subscriptions
- **Sort by amount**: Files naturally sort by date, but you can also filter by price
- **Track spending**: Quickly see how much you spent in any given month

## 🏗️ Project Structure

```
pdf-invoice-renamer/
├── convert-pdfs.js          # Main script with date & price extraction
├── setup-env.bat           # API key setup helper (Windows)
├── env.example             # Environment template
├── .env                    # Your API key (create from env.example)
├── package.json            # Dependencies
└── README.md               # This file
```

## ⚙️ Configuration

The script automatically creates an `images/` folder in each processed directory containing the converted JPEG files for reference.

### Supported Data Extraction
**Dates**: The AI automatically identifies invoice/billing dates in various formats and languages
**Prices**: The AI finds the final total amount including taxes and fees, ignoring subtotals

### File Naming Convention
`YYYY-MM-Month_€XX.XX_originalfilename.pdf`
- `YYYY`: 4-digit year
- `MM`: 2-digit month (01-12) 
- `Month`: 3-letter month abbreviation (Jan, Feb, Mar, etc.)
- `€XX.XX`: Total amount with 2 decimal places
- If only date is found: `YYYY-MM-Month_originalfilename.pdf`
- If only price is found: `€XX.XX_originalfilename.pdf`

## 💡 Use Cases

- **Personal Finance**: Organize personal invoices with amounts for budget tracking
- **Small Business**: Manage vendor invoices with totals for expense reports
- **Accounting**: Prepare invoice files with amounts for bookkeeping software
- **Tax Preparation**: Chronologically organize tax-relevant documents with amounts
- **Digital Archiving**: Convert legacy invoice systems to organized format with pricing data
- **Expense Tracking**: Quickly identify high-value transactions or recurring costs

## 🔒 Privacy & Security

- **Local Processing**: PDF conversion happens locally on your machine
- **Secure API**: Only image data is sent to OpenAI for date and price extraction
- **No Data Storage**: OpenAI doesn't store the processed images
- **API Key Security**: Your API key is stored in `.env` file (automatically ignored by git)
- **Never commit your .env file**: The `.env` file is gitignored to prevent accidental API key exposure

## 💰 Cost Estimation

Using GPT-4o-mini Vision API:
- **~$0.00015 per image** (very affordable)
- **100 invoices ≈ $0.015** (less than 2 cents)
- **1000 invoices ≈ $0.15** (15 cents)

*Even with the enhanced price extraction, costs remain the same as we use a single API call per invoice.*

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features (like currency detection, tax extraction, etc.)
- Submit pull requests
- Improve documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [pdf-poppler](https://www.npmjs.com/package/pdf-poppler) for reliable PDF to image conversion
- [OpenAI](https://openai.com/) for powerful vision AI capabilities that can extract both dates and prices
- All contributors and users of this tool

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing [Issues](https://github.com/sgeier/pdf-invoice-renamer/issues)
2. Create a new issue with details about your problem
3. Include your OS, Node.js version, and error messages

---

**⭐ Star this repository if it helped you organize your invoices with dates AND prices!** 