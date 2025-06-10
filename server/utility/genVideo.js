import enhanceContent from '@/lib/enhancer';
import {overlayTextOnCanvas, overlapTitle} from '@/lib/overlapText';
import generateImage from '@/lib/genImg';
import getNewsArticles from '@/lib/get_news';
import getfilefrompython from '@/lib/combineImages';
import GenDetails from '@/lib/genDetails';

export default async function makeSendVideo() {
    try {
        const newsData = await getNewsArticles();
        const articles = newsData.articles || [];
        const collectionOfImages = [];
        const collectionOfTexts = [];
        console.log("Total number of articles:", articles.length);
        
        for (const article of articles) {
            const summary = article.summary !== 'No summary available' ? article.summary : 'No summary available';
            const { Enhanced_title, Enhanced_summary, Image_prompt } = await enhanceContent(article.title, summary);
            
            collectionOfTexts.push(Enhanced_title, Enhanced_summary);
            const Blurred_imgBuffer_WithoutOverlap = await generateImage(Image_prompt);
            // *
            const imgBuffer_first = await overlapTitle(Blurred_imgBuffer_WithoutOverlap, Enhanced_title);
            const imgBase64_first = imgBuffer_first.toString('base64');
            collectionOfImages.push(imgBase64_first);
            // *
            const imgBuffer = await overlayTextOnCanvas(Blurred_imgBuffer_WithoutOverlap, Enhanced_title, Enhanced_summary);
            const imgBase64 = imgBuffer.toString('base64');
            collectionOfImages.push(imgBase64);
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        const { title: VideoTitle, description: VideoDescription } = await GenDetails(collectionOfTexts);
        const videoMP4 = await getfilefrompython(collectionOfImages);
        
        return { 
            success: true, 
            video: videoMP4,
            totalImages: collectionOfImages.length,
            title: VideoTitle,
            description: VideoDescription
        };
    } catch (err) {
        console.error('[MakeSendVideo ERROR]', err);
        return {
            success: false,
            error: err.message
        };
    }
}
