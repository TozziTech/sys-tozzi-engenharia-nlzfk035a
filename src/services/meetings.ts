import pb from '@/lib/pocketbase/client'

export const getMeetings = () =>
  pb.collection('meetings').getFullList({ expand: 'project', sort: '-date_time' })
export const getMeeting = (id: string) =>
  pb.collection('meetings').getOne(id, { expand: 'project' })
export const createMeeting = (data: any) => pb.collection('meetings').create(data)
export const updateMeeting = (id: string, data: any) => pb.collection('meetings').update(id, data)
export const deleteMeeting = (id: string) => pb.collection('meetings').delete(id)

export const getMeetingAgenda = (meetingId: string) =>
  pb
    .collection('meeting_agenda_items')
    .getFullList({ filter: `meeting = '${meetingId}'`, expand: 'responsible', sort: 'order' })
export const createAgendaItem = (data: any) => pb.collection('meeting_agenda_items').create(data)
export const updateAgendaItem = (id: string, data: any) =>
  pb.collection('meeting_agenda_items').update(id, data)
export const deleteAgendaItem = (id: string) => pb.collection('meeting_agenda_items').delete(id)

export const getMeetingDocuments = (meetingId: string) =>
  pb
    .collection('meeting_documents')
    .getFullList({ filter: `meeting = '${meetingId}'`, sort: '-created' })
export const createMeetingDocument = (data: FormData) =>
  pb.collection('meeting_documents').create(data)
export const deleteMeetingDocument = (id: string) => pb.collection('meeting_documents').delete(id)

export const getMeetingMinutesVersions = (meetingId: string) =>
  pb
    .collection('meeting_minutes_versions')
    .getFullList({ filter: `meeting = '${meetingId}'`, expand: 'author', sort: '-created' })
export const createMeetingMinutesVersion = (data: any) =>
  pb.collection('meeting_minutes_versions').create(data)

export const getMeetingActions = (meetingId: string) =>
  pb
    .collection('meeting_actions')
    .getFullList({ filter: `meeting = '${meetingId}'`, expand: 'responsible', sort: '-created' })
export const createMeetingAction = (data: any) => pb.collection('meeting_actions').create(data)
export const updateMeetingAction = (id: string, data: any) =>
  pb.collection('meeting_actions').update(id, data)
export const deleteMeetingAction = (id: string) => pb.collection('meeting_actions').delete(id)
