export class NotificationService<IconType> {
  public notifications: PushNotification<IconType>[] = [];

  public show(n: PushNotification<IconType>, timeout: number = 5000): void {
    this.notifications.push(n);
    setTimeout(() => {
      this.notifications = this.notifications.filter(x => x !== n);
    }, timeout);
  }
}

export class PushNotification<IconType> {
  title: string;
  text: string;
  icon: IconType;

  constructor(title: string, text: string, icon: IconType) {
    this.title = title;
    this.text = text;
    this.icon = icon;
  }
}
