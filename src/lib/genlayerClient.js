import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'

export const readClient = createClient({ chain: studionet })

export const createWriteClient = ({ account, provider }) =>
  createClient({
    chain: studionet,
    account,
    provider,
  })
