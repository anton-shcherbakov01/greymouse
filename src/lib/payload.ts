import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Единый инстанс Payload для серверных компонентов и экшенов.
 * `getPayload` сам кеширует соединение между вызовами.
 */
export const getPayloadClient = async () => getPayload({ config: configPromise })
