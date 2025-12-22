import { Users, User } from "lucide-react"
import Link from "next/link"

export default function CastSection({ cast }) {
  if (!cast || cast.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold text-foreground">Cast</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cast.map((actor) => (
          <Link 
            key={actor.id} 
            href={`/actor/${actor.id}`}
            className="text-center group cursor-pointer"
          >
            <div className="w-full aspect-square bg-secondary rounded-full mb-3 overflow-hidden">
              {actor.profilePath ? (
                <img
                  src={actor.profilePath}
                  alt={actor.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="font-semibold text-foreground text-sm line-clamp-2 mb-1">{actor.name}</p>
            {actor.character && (
              <p className="text-xs text-muted-foreground line-clamp-2">{actor.character}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
