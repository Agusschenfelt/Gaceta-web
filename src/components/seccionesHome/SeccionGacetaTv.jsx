import { useState, useEffect } from 'react';
import { TextDiv } from '../ui/AnimatedSection'


export default function SeccionGacetaTv() {
  const videoIds = [
    'nVIm2-qJzYA',
    'yXEHvgxi3MI',
    'uIByPBurV5g',
    'MKFDGc5f_5s',
    '-_1lMtVJpAQ',
    'oHzDMW2RWvw',
    'R2BO2v6PTgY',
  ];

  const [videoId, setVideoId] = useState('');

  useEffect(() => {
    const randomId = videoIds[Math.floor(Math.random() * videoIds.length)];
    setVideoId(randomId);
  }, []);

  return (
    <section className='flex flex-col gap-8'>
        <TextDiv>
            <span className="font-medium ml-14 text-orange-500 text-lg subtitulo">#GaceTv</span> 
            <h2 className="titulo ml-14">crear. <br /> <span className="font-instrument italic">escuchar.</span> <br />compartir.</h2>
        </TextDiv>
        <div className="aspect-video w-full max-w-3xl">
            {videoId && (
            <iframe 
                className="w-full min-h-96 rounded-3xl"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title="GaceTv" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
                loading="lazy"
            ></iframe>
            )}
        </div>
        
    </section>
  );
}