import React, { useState } from 'react';

import { Button, Col, Row, Typography } from 'antd';
import { Trash } from 'react-feather';

import { ChannelMemberResource } from 'app/models/Channel';
import { getUserParts } from 'app/components/Member/UserParts';
import Languages from 'services/languages/languages.js';
import './MemberChannelRow.scss';
import Menu from 'app/components/Menus/Menu';
import Icon from 'app/components/Icon/Icon';
import AccessRightsService from 'app/services/AccessRightsService';
import RouterServices from 'services/RouterService';
import Collection from 'app/services/Collections/Collection';
import UsersService from 'services/user/user.js';

const { Text } = Typography;

type Props = {
  channelId: string;
  userId: string;
  inAddition?: boolean;
  collection: Collection<ChannelMemberResource>;
};

export default (props: Props) => {
  let userEvents: JSX.Element;
  const [isMember, setIsMember] = useState<boolean>(false);
  const { workspaceId } = RouterServices.useRouteState(({ workspaceId }) => {
    return { workspaceId };
  });
  const userId: string = UsersService.getCurrentUserId();

  const { avatar, name, users } = getUserParts({
    usersIds: [props.userId] || [],
    max: 6,
    size: 24,
  });

  const addUser = async (userId: string) => {
    if (userId) {
      await props.collection.upsert(
        new ChannelMemberResource({
          user_id: userId,
          channel_id: props.channelId,
          type: 'member', // "member" | "guest" | "bot",
        }),
      );
      return setIsMember(true);
    }
  };

  const leaveChannel = async () => {
    //Fixme, this is not pretty, we should find a way to do this in one line
    const channelMemberResource = new ChannelMemberResource({
      user_id: userId,
      channel_id: props.channelId,
      type: 'member', // "member" | "guest" | "bot",
    });
    channelMemberResource.setPersisted();
    await props.collection.upsert(channelMemberResource, { withoutBackend: true });
    await props.collection.remove(channelMemberResource);
    return setIsMember(false);
  };

  if (props.inAddition) {
    const buttonStyle: { [key: string]: string } = {
      minWidth: '42px',
      height: '25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: isMember ? 'var(--grey-dark)' : '',
      backgroundColor: isMember ? 'var(--grey-background)' : 'var(--primary)',
    };
    userEvents = (
      <Col>
        <Button
          type="primary"
          style={buttonStyle}
          disabled={isMember}
          onClick={() => addUser(props.userId)}
        >
          {Languages.t('general.add')}
        </Button>
      </Col>
    );
  } else {
    let menu: any = [
      {
        text: (
          <div style={{ color: 'var(--red)' }}>
            {Languages.t('scenes.client.channelbar.channelmemberslist.menu.option_2')}
          </div>
        ),
        icon: <Trash size={16} color="var(--red)" />,
        onClick: leaveChannel,
      },
    ];
    userEvents = (
      <Col>
        <div className="more-icon">
          <Menu menu={menu} className="options">
            <Icon type="ellipsis-h more-icon grey-icon" />
          </Menu>
        </div>
      </Col>
    );
  }

  if (!users[0]) {
    return <></>;
  }

  return (
    <Row key={`key_${props.userId}`} align="middle" gutter={[0, 16]}>
      <Col className="small-right-margin">{avatar}</Col>
      <Col flex={4}>
        <Text strong>{name}</Text> @{users[0]?.username}
      </Col>
      {AccessRightsService.hasLevel(workspaceId || '', 'member') &&
        props.userId !== userId &&
        userEvents}
    </Row>
  );
};
