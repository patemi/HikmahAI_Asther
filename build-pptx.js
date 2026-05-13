const pptxgen = require('pptxgenjs');
const path = require('path');

// Resolve html2pptx from the skill scripts
const html2pptx = require(path.resolve('C:/Users/lenovo/.gemini/antigravity/skills/pptx-official/scripts/html2pptx.js'));

const slidesDir = path.resolve(__dirname, 'ppt-slides');
const outputFile = path.resolve(__dirname, 'Asther_Sidang_v4.pptx');

async function buildPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Muhammad Rakha Abimanyu';
  pptx.title = 'Sidang Pendadaran - Platform Chatbot Asther Berbasis RAG untuk Domain Keilmuan Islam';
  pptx.subject = 'Sidang Pendadaran Informatika UMS';

  const slides = [
    'slide01-cover.html',
    'slide02-agenda.html',
    'slide03-latar-belakang.html',
    'slide04-rumusan-solusi.html',
    'slide05-metode.html',
    'slide06-data.html',
    'slide07-arsitektur.html',
    'slide08-rag.html',
    'slide09-klasifikasi.html',
    'slide10-alur-chat.html',
    'slide11-evaluasi.html',
    'slide12-metrik.html',
    'slide13-validasi.html',
    'slide14-kesimpulan.html',
    'slide15-penutup.html',
  ];

  for (let i = 0; i < slides.length; i++) {
    const htmlFile = path.join(slidesDir, slides[i]);
    console.log(`Processing slide ${i + 1}/${slides.length}: ${slides[i]}`);
    try {
      const { slide, placeholders } = await html2pptx(htmlFile, pptx, { tmpDir: slidesDir });

      // Add chart to the evaluation slide (slide 11, index 10)
      if (i === 10 && placeholders.length > 0) {
        slide.addChart(pptx.charts.BAR, [{
          name: 'Relevance & Accuracy',
          labels: ['QURAN', 'FIQH', 'AQIDAH'],
          values: [89.1, 70.9, 98.6]
        }], {
          ...placeholders[0],
          barDir: 'col',
          showTitle: true,
          title: 'Skor Relevance/Accuracy per Kategori (%)',
          titleFontSize: 8,
          showLegend: false,
          showCatAxisTitle: false,
          showValAxisTitle: true,
          valAxisTitle: 'Skor (%)',
          valAxisMaxVal: 100,
          valAxisMinVal: 0,
          valAxisMajorUnit: 25,
          dataLabelPosition: 'outEnd',
          dataLabelColor: '333333',
          dataLabelFontSize: 8,
          showValue: true,
          chartColors: ['2D9CDB', 'D4A84B', '1B7A4E'],
          catAxisLabelFontSize: 8,
          valAxisLabelFontSize: 7,
        });
      }
    } catch (err) {
      console.error(`Error on ${slides[i]}:`, err.message);
    }
  }

  await pptx.writeFile({ fileName: outputFile });
  console.log(`\nPresentation saved to: ${outputFile}`);
}

buildPresentation().catch(console.error);
