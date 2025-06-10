import axios from 'axios';
import * as cheerio from 'cheerio';
import clientPromise from './mongodb.js';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};


class NewsExtractor {
    constructor() {
        this.limit = 20;
        this.articlesGoing = 2;
    }
  async extractPhysOrgNews() {
    try {
      const url = "https://phys.org/physics-news/quantum-physics/";
      const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      const articles = [];
      $('article.sorted-article').slice(0, this.limit).each((i, article) => {
        try {
          const $article = $(article);
          
          const titleElem = $article.find('h3, h2').first();
          const title = titleElem.text().trim() || "No title";
          
          const linkElem = titleElem.find('a');
          const link = linkElem.length ? new URL(linkElem.attr('href'), url).href : "";
          
          const summaryElem = $article.find('p.sorted-article__summary, p').first();
          let summary = summaryElem.text().trim() || "No summary available";
          if (summary.length > 300) summary = summary.substring(0, 300) + "...";
          
          const dateElem = $article.find('time, span.sorted-article__date');
          const date = dateElem.text().trim() || "Date not available";
          
          const engagementElem = $article.find('span.sorted-article__views');
          const engagement = engagementElem.text().trim() || "0";
          
          if (title !== "No title" && link) {
            articles.push({
              title,
              link,
              summary,
              date,
              source: 'Phys.org - Quantum Physics',
              engagement
            });
          }
        } catch (error) {
          console.error('Error processing Phys.org article:', error);
        }
      });
      
      return articles;
    } catch (error) {
      console.error('Error extracting from Phys.org:', error);
      return [];
    }
  }

  async extractAINews() {
    try {
      const url = "https://www.artificialintelligence-news.com/";
      const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      const articles = [];
      $('article, div.post').slice(0, this.limit).each((i, article) => {
        try {
          const $article = $(article);
          
          const titleElem = $article.find('h1, h2, h3, a.entry-title-link').first();
          const title = titleElem.text().trim() || "No title";
          
          const linkElem = titleElem.find('a').length ? titleElem.find('a') : $article.find('a').first();
          const link = linkElem.length ? new URL(linkElem.attr('href'), url).href : "";
          
          const summaryElem = $article.find('div.entry-summary, div.excerpt, p').first();
          let summary = summaryElem.text().trim() || "No summary available";
          if (summary.length > 300) summary = summary.substring(0, 300) + "...";
          
          const dateElem = $article.find('time, span.published, div.entry-meta');
          const date = dateElem.text().trim() || "Date not available";
          
          const engagementKeywords = ['breakthrough', 'major', 'new', 'latest'];
          const engagement = engagementKeywords.some(word => title.toLowerCase().includes(word)) ? 'High' : 'Medium';
          
          if (title !== "No title" && link) {
            articles.push({
              title,
              link,
              summary,
              date,
              source: 'AI News',
              engagement
            });
          }
        } catch (error) {
          console.error('Error processing AI News article:', error);
        }
      });
      
      return articles;
    } catch (error) {
      console.error('Error extracting from AI News:', error);
      return [];
    }
  }

  async extractFutureToolsNews() {
    try {
      const url = "https://www.futuretools.io/news";
      const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      const articles = [];
      $('div.news-item, article, div.post').slice(0, this.limit).each((i, article) => {
        try {
          const $article = $(article);
          
          const titleElem = $article.find('h1, h2, h3, a').first();
          const title = titleElem.text().trim() || "No title";
          
          const linkElem = titleElem.is('a') ? titleElem : titleElem.find('a').first() || $article.find('a').first();
          const link = linkElem.length ? new URL(linkElem.attr('href'), url).href : "";
          
          const summaryElem = $article.find('p, div.description, div.excerpt').first();
          let summary = summaryElem.text().trim() || "No summary available";
          if (summary.length > 300) summary = summary.substring(0, 300) + "...";
          
          const dateElem = $article.find('time, span.date, div.meta');
          const date = dateElem.text().trim() || "Date not available";
          
          const engagementKeywords = ['ai', 'tool', 'new', 'best'];
          const engagement = engagementKeywords.some(word => title.toLowerCase().includes(word)) ? 'High' : 'Medium';
          
          if (title !== "No title" && link) {
            articles.push({
              title,
              link,
              summary,
              date,
              source: 'Future Tools',
              engagement
            });
          }
        } catch (error) {
          console.error('Error processing Future Tools article:', error);
        }
      });
      
      return articles;
    } catch (error) {
      console.error('Error extracting from Future Tools:', error);
      return [];
    }
  }

  async extractNewScientistNews() {
    try {
      const url = "https://www.newscientist.com/subject/technology/";
      const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      const articles = [];
      $('a.CardLink').slice(0, this.limit).each((i, cardLink) => {
        try {
          const $cardLink = $(cardLink);
          
          const link = new URL($cardLink.attr('href'), url).href;
          
          const $article = $cardLink.find('article.Card');
          if (!$article.length) return;
          
          const titleElem = $article.find('h3.Card__Title');
          const title = titleElem.text().trim() || "No title";
          
          const categoryElem = $article.find('h4.Card__Category');
          const category = categoryElem.text().trim() || "";
          
          const contentTypeElem = $article.find('p.Card__SubjectType');
          const contentType = contentTypeElem.text().trim() || "";
          
          const imgElem = $article.find('img.Image');
          const imgCaption = imgElem.attr('data-caption') || "";
          const imgCredit = imgElem.attr('data-credit') || "";
          
          const summaryParts = [];
          if (imgCaption) summaryParts.push(imgCaption);
          if (imgCredit) summaryParts.push(`Credit: ${imgCredit}`);
          let summary = summaryParts.join(' | ') || "No summary available";
          if (summary.length > 300) summary = summary.substring(0, 300) + "...";
          
          const engagementKeywords = ['breakthrough', 'discovery', 'new', 'revolutionary', 'ai', 'quantum', 'advanced', 'innovative', 'first', 'major'];
          const engagement = engagementKeywords.some(word => title.toLowerCase().includes(word)) ? 'High' : 'Medium';
          
          if (title !== "No title" && link) {
            articles.push({
              title,
              link,
              summary,
              date: "Date not available",
              source: 'New Scientist - Technology',
              category,
              contentType,
              engagement
            });
          }
        } catch (error) {
          console.error('Error processing New Scientist article:', error);
        }
      });
      
      return articles;
    } catch (error) {
      console.error('Error extracting from New Scientist:', error);
      return [];
    }
  }

  async getAllNews() {
    const allArticles = [];
    
    console.log("Extracting from Phys.org...");
    const physArticles = await this.extractPhysOrgNews();
    allArticles.push(...physArticles);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Extracting from AI News...");
    const aiArticles = await this.extractAINews();
    allArticles.push(...aiArticles);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Extracting from Future Tools...");
    const futureToolsArticles = await this.extractFutureToolsNews();
    allArticles.push(...futureToolsArticles);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Extracting from New Scientist...");
    const newScientistArticles = await this.extractNewScientistNews();
    allArticles.push(...newScientistArticles);
    
    const validArticles = allArticles.filter(article => 
      article.title !== "No title" && article.link
    );
    
    const engagementScore = (article) => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      
      const highKeywords = ['breakthrough', 'revolutionary', 'major', 'new', 'latest', 'ai', 'quantum', 'innovative', 'discovery', 'advanced'];
      score += highKeywords.filter(keyword => titleLower.includes(keyword)).length * 2;
      
      const mediumKeywords = ['technology', 'research', 'development', 'tool', 'update'];
      score += mediumKeywords.filter(keyword => titleLower.includes(keyword)).length;
      
      return score;
    };
    validArticles.sort((a, b) => engagementScore(b) - engagementScore(a));
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection(process.env.MONGODB_COLLECTION);
    let n = validArticles.length;
    let i = 0;

    while (i + this.articlesGoing <= n) {
        const batch = validArticles.slice(i, i + this.articlesGoing);
        const batchTitles = batch.map(article => article.title);
    
        const existing = await collection.find({ title: { $in: batchTitles } }).toArray();
        const existingTitles = new Set(existing.map(a => a.title));
    
        if (batchTitles.every(title => !existingTitles.has(title))) {
          await collection.insertMany(batch);
          return batch;
        }
        i += this.articlesGoing;
      }
    
      return [];
  }
}

export default async function getNewsArticles() {
  try {
    const extractor = new NewsExtractor();
    const newsArticles = await extractor.getAllNews();
    
    return {
      status: 'success',
      totalArticles: newsArticles.length,
      timestamp: new Date().toISOString(),
      articles: newsArticles
    };
  } catch (error) {
    console.error('Error in news extraction:', error);
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
      articles: []
    };
  }
}
