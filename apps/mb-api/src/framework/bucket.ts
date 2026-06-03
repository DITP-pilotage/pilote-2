import { Temporal } from '@/framework/temporal'

// Un "bucket" représente le 1er jour d'une période tronquée (jour, mois, année).
// On utilise `Temporal.PlainDate` parce qu'il porte une date calendaire sans
// fuseau ni heure : impossible d'introduire un offset TZ qui ferait glisser
// le bucket d'un jour. La sérialisation ISO (`toString()`) produit `YYYY-MM-DD`,
// qui sert à la fois de clé de Map et de payload API.
export type Bucket = Temporal.PlainDate

export type BucketKey = string

export const parseBucket = (iso: string): Bucket => Temporal.PlainDate.from(iso)

export const formatBucket = (b: Bucket): BucketKey => b.toString()

export const compareBuckets = (a: Bucket, b: Bucket): number => Temporal.PlainDate.compare(a, b)
