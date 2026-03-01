
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ARTISTS = [
  { username:'kolo_officiel', display_name:'Kolo Officiel', bio:'Artiste Twarab des Comores', is_verified:true, profile_type:'listener', country:'KM' },
  { username:'dj_chami', display_name:'DJ Chami', bio:'DJ & Producteur Moroni', is_verified:true, profile_type:'listener', country:'KM' },
  { username:'wassila_km', display_name:'Wassila', bio:'Voix de la nouvelle generation comorienne', is_verified:false, profile_type:'listener', country:'KM' },
  { username:'coach_amina', display_name:'Coach Amina', bio:'Mindset & Business Africa', is_verified:true, profile_type:'listener', country:'SN' },
  { username:'radio_komori', display_name:'Radio Komori FM', bio:'La radio des iles', is_verified:true, profile_type:'listener', country:'KM' },
  { username:'wally_afro', display_name:'Wally Afro', bio:'Afrobeats depuis Abidjan', is_verified:false, profile_type:'listener', country:'CI' },
]

const TRACKS = [
  { title:'Twarab ya Komori', genre:'Twarab', access_type:'free', play_count:24800, artist:0 },
  { title:'Moroni by Night', genre:'Afrobeats', access_type:'paid', sale_price:2500, play_count:18200, artist:1 },
  { title:'Slam pour demain', genre:'Slam', access_type:'free', play_count:7200, artist:2 },
  { title:'Mindset Afrique', genre:'Mindset', access_type:'free', play_count:15000, artist:3 },
  { title:'Sebene Forever', genre:'Sebene', access_type:'paid', sale_price:1500, play_count:9400, artist:1 },
  { title:'Gospel Unangu', genre:'Gospel / Religion', access_type:'free', play_count:6100, artist:2 },
  { title:'Business Africa Ep.14', genre:'Business', access_type:'free', play_count:11000, artist:3 },
  { title:'Amapiano Comores', genre:'Amapiano', access_type:'paid', sale_price:2000, play_count:8800, artist:0 },
]

const COVERS = [
  'https://placehold.co/400x400/0d2a3a/f5a623?text=TW',
  'https://placehold.co/400x400/1a0a2e/9b59f5?text=MN',
  'https://placehold.co/400x400/2e1200/ff6b35?text=SL',
  'https://placehold.co/400x400/002a1a/2dc653?text=MS',
  'https://placehold.co/400x400/1a0020/e63946?text=SB',
  'https://placehold.co/400x400/1a1800/f5a623?text=GP',
  'https://placehold.co/400x400/001a2e/4d9fff?text=BA',
  'https://placehold.co/400x400/0a1e2e/4d9fff?text=AM',
]

const AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

async function seed() {
  console.log('SERVICE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0,30) + '...')
  console.log('Seeding donnees demo...\n')

  for (const a of ARTISTS) {
    const { error } = await supabase.from('profiles').upsert(a, { onConflict: 'username' })
    if (error) console.log('ERREUR artiste', a.username, error.message)
    else console.log('OK Artiste:', a.display_name)
  }

  const { data: profiles, error: pErr } = await supabase
    .from('profiles').select('id,username')
    .in('username', ARTISTS.map(a => a.username))

  if (pErr || !profiles?.length) {
    console.log('ERREUR profils:', pErr?.message)
    return
  }
  console.log('Profils OK:', profiles.length)

  const profileMap = {}
  profiles.forEach(p => profileMap[p.username] = p.id)

  for (let i = 0; i < TRACKS.length; i++) {
    const t = TRACKS[i]
    const userId = profileMap[ARTISTS[t.artist].username]
    if (!userId) { console.log('Pas de user_id pour', t.title); continue }

    const { error } = await supabase.from('tracks').insert({
      user_id: userId,
      title: t.title,
      genre: t.genre,
      description: t.title + ' - Waiichia exclusive',
      cover_url: COVERS[i],
      audio_url: AUDIO,
      access_type: t.access_type,
      sale_price: t.sale_price || null,
      is_published: true,
      play_count: t.play_count,
    })
    if (error) console.log('ERREUR son', t.title, error.message)
    else console.log('OK Son:', t.title)
  }

  console.log('\nSeeding termine !')
}

seed().catch(console.error)
