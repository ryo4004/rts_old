const CACHE_NAME = 'winds-archive-cache-20181017001'
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico'
]

self.addEventListener('install', event => {
  // console.log('[sw] install', event)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // console.log('[sw] cache open')
        // return cache.addAll(urlsToCache)
        return cache.addAll(urlsToCache.map(function(urlsToCache) {
          return new Request(urlsToCache, { mode: 'no-cors' })
        })).then(function() {
          // console.log('All resources have been fetched and cached.')
        })
      })
  )
})
self.addEventListener('fetch', event => {
  // console.log('[sw] fetch', event)
  // console.log('[sw] fetchEvent', event.request.url)
  if (event.request.url.match(/\.mp3$/)) return
  if (event.request.url.match(/\.mp4$/)) return
  if (event.request.url.match(/\.png$/)) return
  if (event.request.method === 'POST') return
  event.respondWith(
    caches.match(event.request)
      .then((res) => {
        // キャッシュがあった場合
        if (res) {
          // console.log('[sw] has cache')
          return res
        }
        // キャッシュがなかったのでリクエストを clone する
        const fetchRequest = event.request.clone()

        // console.log('[sw] event.request', event.request)

        return fetch(event.request)
          .then((res) => {

            // レスポンスが正しいかを確認
            if (!res || res.status !== 200 || res.type !== 'basic') return res

            // if (res.request.method === 'POST') return res

            // レスポンスは Stream でブラウザ用とキャッシュ用の2回必要なので clone する
            const responseToCache = res.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return res
          })

          // .catch(function(err) {       // fallback mechanism
          //   return caches.open(CACHE_CONTAINING_ERROR_MESSAGES)
          //   .then(function(cache) {
          //     return cache.match('/offline.html');
          //   });
          // });
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('[sw] activate', event)
  var cacheWhitelist = ['winds-archive-cache-20181017001']

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // console.log('[sw] cache delete', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// pushイベント
// … プッシュでメッセージを受信した時に発生
self.addEventListener('push', event => {
  // 受信したメッセージ
  const pushMessage = event.data.text();

  // 通知の表示
  const title = 'プッシュ通知を受信しました';
  const options = { body: pushMessage };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// notificationclickイベント
// … 通知をクリックした時に発生
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});