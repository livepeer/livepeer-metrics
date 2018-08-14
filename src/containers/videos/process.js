
export function makeOverview(src) {
  const videos = {
    total: 0,
    failed: 0,
    totalDuration: 0
  }
  const segments = {
    emerged: 0,
    uploaded: 0,
    transcoded: 0,
    avgUploadDuration: 0,
    avgTranscodeDuration: 0,
    failureRate: 0,
  }
  let fromTime = new Date()
  let toTime = null
  const broadcastersAddresses = new Set()

  let transcodeTime = 0
  let uploadTime = 0
  for (let vi of src.videos) {
    videos.total++
    if (vi.success !== 'true') {
      videos.failed++
    }
    if (vi.createTime) {
      const createTime = new Date(vi.createTime)
      if (createTime < fromTime) {
        fromTime = createTime
      }
    }
    if (vi.endTime) {
      const endTime = new Date(vi.endTime)
      if (endTime > toTime) {
        toTime = endTime
      }
    }
    if (vi.streamDuration) {
      videos.totalDuration += vi.streamDuration
    }
    if (vi.broadcasterAddress) {
      broadcastersAddresses.add(vi.broadcasterAddress)
    }
    segments.emerged += vi.segmentsEmerged
    segments.uploaded += vi.segmentsUploaded
    segments.transcoded += vi.segmentsTranscoded
    transcodeTime += vi.segmentsTranscodeTimeSum
    uploadTime += vi.segmentUploadTimeSum
  }
  if (segments.emerged) {
    segments.failureRate = (segments.emerged - segments.transcoded) / segments.emerged * 100
  }
  segments.avgTranscodeDuration = transcodeTime / segments.transcoded
  segments.avgUploadDuration = uploadTime / segments.uploaded
  return {
    videos,
    segments,
    fromTime,
    toTime,
    distinctBroadcasters: broadcastersAddresses.size,
  }
}
