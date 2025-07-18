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
    <section className='flex flex-col gap-10 lg:gap-14'>
        <TextDiv className='ml-14 lg:ml-[11.5rem]'>
            <span className="font-medium text-orange-500 text-lg xl:text-xl subtitulo">#GaceTv</span> 
            <h2 className="titulo">crear. <br /> <span className="font-instrument italic">escuchar.</span> <br />compartir.</h2>
        </TextDiv>
        <div className="aspect-video w-full lg:max-w-[75%] lg:m-auto">
            {videoId && (
            <iframe 
                className="w-full min-h-96 rounded-3xl lg:h-full "
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