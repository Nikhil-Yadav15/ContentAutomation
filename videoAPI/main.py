from flask import Flask, request, send_file, jsonify
import os
import tempfile
import base64
import io
from PIL import Image
from moviepy.editor import ImageSequenceClip, AudioFileClip
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

MAX_CONTENT_LENGTH = 100 * 1024 * 1024

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def base64_to_image(base64_string):
    try:
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        return image
    except Exception as e:
        logger.error(f"Error converting base64 to image: {str(e)}")
        raise ValueError(f"Invalid base64 image data: {str(e)}")

def resize_and_pad_image(image, target_width=1080, target_height=1920):
    img_ratio = image.width / image.height
    target_ratio = target_width / target_height
    
    if img_ratio > target_ratio:
        new_width = target_width
        new_height = int(target_width / img_ratio)
    else:
        new_height = target_height
        new_width = int(target_height * img_ratio)
    
    resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    padded_image = Image.new('RGB', (target_width, target_height), (0, 0, 0))
    
    x_offset = (target_width - new_width) // 2
    y_offset = (target_height - new_height) // 2
    
    padded_image.paste(resized_image, (x_offset, y_offset))
    
    return padded_image

def create_video_from_images_and_audio(images_data, audio_file_path, duration_per_image=10):
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            processed_images = []
            image_files = []
            
            for i, img_data in enumerate(images_data):
                try:
                    image = base64_to_image(img_data)
                    processed_image = resize_and_pad_image(image)
                    img_path = os.path.join(temp_dir, f'image_{i:04d}.jpg')
                    processed_image.save(img_path, 'JPEG', quality=85)
                    image_files.append(img_path)
                    
                    logger.info(f"Processed image {i+1}/{len(images_data)}")
                    
                except Exception as e:
                    logger.error(f"Error processing image {i}: {str(e)}")
                    continue
            
            if not image_files:
                raise ValueError("No valid images could be processed")
            logger.info("Creating video clip from images...")
            video_clip = ImageSequenceClip(image_files, durations=[duration_per_image] * len(image_files))
            video_duration = len(image_files) * duration_per_image
            
            logger.info(f"Video duration: {video_duration}s")
            
            logger.info("Processing audio...")
            audio_clip = AudioFileClip(audio_file_path)
            audio_duration = audio_clip.duration
            
            logger.info(f"Audio duration: {audio_duration}s")
            if audio_duration < video_duration:
                loops_needed = int(video_duration / audio_duration) + 1
                audio_clip = audio_clip.loop(n=loops_needed).subclip(0, video_duration)
                logger.info(f"Audio looped {loops_needed} times to match video duration")
            else:
                audio_clip = audio_clip.subclip(0, video_duration)
                logger.info("Audio trimmed to match video duration")
            logger.info("Combining video and audio...")
            final_video = video_clip.set_audio(audio_clip)
            output_path = os.path.join(temp_dir, 'output_video.mp4')

            logger.info("Writing final video...")
            logger.info(f"About to write video. Memory usage: {get_memory_usage():.2f}MB")
            logger.info(f"Video clip duration: {final_video.duration}s")
            logger.info(f"Output path: {output_path}")
            final_video.write_videofile(
                output_path,
                fps=24,
                codec='libx264',
                audio_codec='aac',
                remove_temp=True,
                verbose=False,
                logger=None
            )
            
            video_clip.close()
            audio_clip.close()
            final_video.close()
            
            with open(output_path, 'rb') as video_file:
                video_data = video_file.read()
            
            logger.info("Video creation completed successfully")
            return video_data
            
    except Exception as e:
        logger.error(f"Error creating video: {str(e)}")
        raise

@app.route('/create-video', methods=['POST'])
def create_video():
    temp_music_path = None
    temp_video_path = None
    
    try:
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({'error': 'Request must be JSON'}), 400
        
        data = request.get_json()
        logger.info(f"Received request data: {str(data)[:200]}...")
        if 'images' not in data or 'music' not in data:
            logger.error("Missing required fields")
            return jsonify({'error': 'Missing required fields: images and music'}), 400
        
        images_data = data['images']
        music_base64 = data['music']
        
        if not isinstance(images_data, list) or len(images_data) == 0:
            logger.error("No images provided or images not in list format")
            return jsonify({'error': 'No images provided or invalid format'}), 400
        
        logger.info(f"Processing {len(images_data)} images")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_music:
            temp_music_path = temp_music.name
            try:
                if music_base64.startswith('data:audio'):
                    music_base64 = music_base64.split(',')[1]
                
                music_data = base64.b64decode(music_base64)
                temp_music.write(music_data)
                temp_music.flush()
                
                logger.info("Music file saved temporarily")
                video_data = create_video_from_images_and_audio(
                    images_data, 
                    temp_music_path, 
                    duration_per_image=10
                )
                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
                    temp_video_path = temp_video.name
                    temp_video.write(video_data)
                    temp_video.flush()
                    
                    logger.info("Video created successfully, sending response")
                    return send_file(
                        temp_video_path,
                        as_attachment=True,
                        download_name='generated_video.mp4',
                        mimetype='video/mp4'
                    )
                    
            except Exception as e:
                logger.error(f"Error in video creation: {str(e)}", exc_info=True)
                return jsonify({'error': f'Video creation failed: {str(e)}'}), 500
                
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500
        
    finally:
        for path in [temp_music_path, temp_video_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    logger.info(f"Cleaned up temporary file: {path}")
                except Exception as e:
                    logger.warning(f"Could not delete temp file {path}: {str(e)}")
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Video creation API is running'})

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 100MB.'}), 413
