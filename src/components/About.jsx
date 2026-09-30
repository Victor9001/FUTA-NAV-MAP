const stack = ['React', 'Tailwind CSS', 'MapLibre GL', 'OpenFreeMap']

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-medium sm:text-3xl">About FUTA Nav</h2>
        <p className="mt-4 text-white/60">
          FUTA Nav is a campus navigator built to help students, visitors, and new
          intakes find their way around the Federal University of Technology, Akure. you can 
          search any building, see it on a real map, and get there faster.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {stack.map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70"
          >
            {tech}
          </span>
        ))}
      </div>
    </section>
  )
}