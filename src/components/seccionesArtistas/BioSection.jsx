export default function BioSection({ bio }) {
    return (
        <section className="flex flex-col md:flex-row justify-end mx-8">
          <div className="md:w-[70%]" />
          <div className="max-w-[650px] md:text-xl text-lg font-inter">
            <p>{bio}</p>
          </div>
        </section>
    )
}